#!/usr/bin/env node
// Reads raw Claude Code session JSONL logs (~/.claude/projects/{slug}/*.jsonl) and
// produces cleaned per-session + index.json artifacts. Fully deterministic: no LLM
// calls, only rule-based extraction, truncation, and static text matching.
//
// Usage: node generate-sessions.mjs [logs-dir] [output-dir] [harness-project-dir]
//
// logs-dir defaults to "harness-logs" — this repo's fabricated dataset of raw
// session transcripts. It intentionally does NOT default to the real
// ~/.claude/projects/{slug} directory for whichever project you run this from:
// this is a public workshop repo, and that default would make the workshop
// analyze the operator's own personal session logs instead of the fabricated
// dataset.
// output-dir defaults to "docs/log-schema" (writes output-dir/index.json and
// output-dir/sessions/{date}/{session_id}.json).
// harness-project-dir defaults to "todo-app" — the directory containing the
// harness being analyzed (CLAUDE.md, .claude/settings.json, .claude/hooks) used
// only to know which hooks are registered, so harness_signals can name them.

import {
  existsSync,
  readFileSync,
  readdirSync,
  writeFileSync,
  mkdirSync,
} from "node:fs";
import { join, relative, resolve, basename } from "node:path";
import {
  loadRegisteredHooks,
  extractAdditionalContextLiteral,
} from "../../../lib/hook-observability.mjs";

const USER_TEXT_MAX = 4000;
const TOOL_TEXT_MAX = 2000;
const PREVIEW_LEN = 500;
const FINAL_MESSAGE_PREVIEW_LEN = 300;

const invocationDir = process.cwd();
const logsDir = resolve(invocationDir, process.argv[2] || "harness-logs");
// Recorded in index.json as a path relative to invocationDir, not the absolute
// filesystem path — otherwise every regenerated index.json bakes in whichever
// machine happened to run this script.
const logsDirForOutput = relative(invocationDir, logsDir) || ".";
const outputDir = resolve(
  invocationDir,
  process.argv[3] || "docs/log-schema",
);
const harnessProjectDir = resolve(
  invocationDir,
  process.argv[4] || "todo-app",
);

function shape(text, maxLen) {
  if (text == null) return { value: null, content_truncated: false };
  if (text.length <= maxLen) return { value: text, content_truncated: false };
  return {
    value: null,
    content_truncated: true,
    original_length_chars: text.length,
    preview: text.slice(0, PREVIEW_LEN),
  };
}

function applyShape(event, field, text, maxLen) {
  const shaped = shape(text, maxLen);
  event[field] = shaped.value;
  if (shaped.content_truncated) {
    event.content_truncated = true;
    event.original_length_chars = shaped.original_length_chars;
    event.preview = shaped.preview;
  }
  return event;
}

function extractContentText(content) {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("\n");
  }
  return "";
}

function parseJsonlFile(path) {
  if (!existsSync(path)) return [];
  const lines = readFileSync(path, "utf8").split("\n");
  const records = [];
  for (const line of lines) {
    if (line.trim() === "") continue;
    try {
      records.push(JSON.parse(line));
    } catch {
      process.stderr.write(`[generate-sessions] skipped malformed line in ${path}\n`);
    }
  }
  return records;
}

const SLASH_COMMAND_RE = /<command-name>\/([^<]+)<\/command-name>/;
const KEPT_ATTACHMENT_TYPES = new Set([
  "skill_listing",
  "plan_mode",
  "mcp_instructions_delta",
  "deferred_tools_delta",
  "agent_listing_delta",
]);

// Builds the cleaned session object for one raw JSONL record array. Used both
// for top-level sessions and (recursively, one level — subagent transcripts
// don't themselves spawn further subagent files in this pipeline) for subagent
// transcripts, since they share the same record schema.
function buildSession(records, canonicalId, harnessHooks) {
  let sessionIdMismatch = null;
  for (const r of records) {
    for (const field of ["sessionId", "session_id"]) {
      if (r[field] && r[field] !== canonicalId) {
        sessionIdMismatch = `record also contained ${field}=${r[field]}; using filename UUID (${canonicalId}) as canonical`;
      }
    }
  }

  const timestamps = records.map((r) => r.timestamp).filter(Boolean).sort();
  const startTime = timestamps[0] ?? null;
  const endTime = timestamps[timestamps.length - 1] ?? null;
  const durationMs =
    startTime && endTime ? Date.parse(endTime) - Date.parse(startTime) : null;

  const entrypoint = records.find((r) => r.entrypoint)?.entrypoint ?? null;
  const cliVersion = records.find((r) => r.version)?.version ?? null;
  const gitBranch = records.find((r) => r.gitBranch)?.gitBranch ?? null;

  const modelsUsed = [
    ...new Set(
      records
        .filter((r) => r.type === "assistant")
        .map((r) => r.message?.model)
        .filter(Boolean),
    ),
  ];

  const aiTitleRecord = [...records].reverse().find((r) => r.type === "ai-title");
  const aiTitle = aiTitleRecord?.aiTitle ?? null;

  const costStateRecord = [...records].reverse().find((r) => r.type === "cost-state");
  let costUsd = null;
  let tokenUsage = { input: 0, output: 0, cache_read: 0, cache_creation: 0 };
  if (costStateRecord) {
    costUsd = costStateRecord.totalCostUSD ?? null;
    for (const usage of Object.values(costStateRecord.modelUsage || {})) {
      tokenUsage.input += usage.inputTokens || 0;
      tokenUsage.output += usage.outputTokens || 0;
      tokenUsage.cache_read += usage.cacheReadInputTokens || 0;
      tokenUsage.cache_creation += usage.cacheCreationInputTokens || 0;
    }
  } else {
    for (const r of records) {
      if (r.type !== "assistant" || !r.message?.usage) continue;
      const u = r.message.usage;
      tokenUsage.input += u.input_tokens || 0;
      tokenUsage.output += u.output_tokens || 0;
      tokenUsage.cache_read += u.cache_read_input_tokens || 0;
      tokenUsage.cache_creation += u.cache_creation_input_tokens || 0;
    }
  }

  const events = [];
  const toolUseIdToName = new Map();
  const toolUseIdToEventIndex = new Map();
  const agentSpawns = new Map(); // agentId -> { toolUseId, eventIndex }
  const planModeTransitions = [];
  const skillsInvoked = [];
  const toolErrors = [];
  const permissionDenials = [];
  const hookFireCounts = new Map(); // `${event}:${file}` -> count

  // Claude Code emits this exact boilerplate as the tool_result text when a user
  // denies a permission prompt — confirmed against real logs (not a guess), so a
  // match on it is tagged "confirmed" rather than "heuristic".
  const CONFIRMED_DENIAL_TEXT = "The user doesn't want to proceed with this tool use. The tool use was rejected";
  const DENIAL_RE = /permission denied|user (rejected|denied)|doesn'?t want to proceed|operation not permitted/i;

  function pushEvent(partial) {
    events.push({ index: events.length, ...partial });
    return events[events.length - 1];
  }

  for (const r of records) {
    switch (r.type) {
      case "user": {
        if (r.isMeta) {
          const text = extractContentText(r.message?.content);
          const ev = pushEvent({ type: "meta_note", timestamp: r.timestamp, actor: "system" });
          applyShape(ev, "text", text, TOOL_TEXT_MAX);
          break;
        }
        const content = r.message?.content;
        if (typeof content === "string") {
          const slashMatch = content.match(SLASH_COMMAND_RE);
          if (slashMatch) {
            pushEvent({
              type: "slash_command",
              timestamp: r.timestamp,
              actor: "human",
              command: `/${slashMatch[1].trim()}`,
            });
            skillsInvoked.push({ name: slashMatch[1].trim(), via: "slash_command" });
            break;
          }
          const ev = pushEvent({
            type: "user_message",
            timestamp: r.timestamp,
            actor: r.origin?.kind === "human" ? "human" : (r.promptSource || "human"),
          });
          applyShape(ev, "text", content, USER_TEXT_MAX);
          for (const hook of harnessHooks) {
            if (hook.event !== "UserPromptSubmit") continue;
            const key = `${hook.event}:${hook.file}`;
            const literal = extractAdditionalContextLiteral(hook.source);
            if (literal && content.includes(literal)) {
              hookFireCounts.set(key, (hookFireCounts.get(key) || 0) + 1);
            }
          }
          break;
        }
        if (Array.isArray(content)) {
          const toolResultBlock = content.find((b) => b.type === "tool_result");
          if (toolResultBlock) {
            const toolName = toolUseIdToName.get(toolResultBlock.tool_use_id) || null;
            const text = extractContentText(toolResultBlock.content);
            const isError = !!toolResultBlock.is_error;
            const ev = pushEvent({
              type: "tool_result",
              timestamp: r.timestamp,
              tool_name: toolName,
              is_error: isError,
            });
            applyShape(ev, "output_summary", text, TOOL_TEXT_MAX);
            if (isError) {
              toolErrors.push({ event_index: ev.index, tool_name: toolName, error_preview: text.slice(0, 300) });
            }
            if (text.includes(CONFIRMED_DENIAL_TEXT)) {
              permissionDenials.push({
                event_index: ev.index,
                tool_name: toolName,
                confidence: "confirmed",
                text_preview: text.slice(0, 300),
              });
            } else if (DENIAL_RE.test(text)) {
              permissionDenials.push({
                event_index: ev.index,
                tool_name: toolName,
                confidence: "heuristic",
                text_preview: text.slice(0, 300),
              });
            }
            // Agent tool subagent spawn marker
            const toolUseResult = r.toolUseResult;
            if (toolUseResult && toolUseResult.isAsync && toolUseResult.agentId) {
              const spawnEventIndex = toolUseIdToEventIndex.get(toolResultBlock.tool_use_id);
              agentSpawns.set(toolUseResult.agentId, {
                toolUseId: toolResultBlock.tool_use_id,
                eventIndex: spawnEventIndex ?? null,
              });
            }
            break;
          }
          const textBlock = content.find((b) => b.type === "text");
          if (textBlock) {
            const text = extractContentText(content);
            const skillNameMatch = text.match(/^Base directory for this skill:.*[\\/]([^\\/\n]+)\n/);
            const ev = pushEvent({
              type: "skill_instructions_loaded",
              timestamp: r.timestamp,
              skill_name: skillNameMatch ? skillNameMatch[1] : null,
            });
            applyShape(ev, "text", text, TOOL_TEXT_MAX);
          }
        }
        break;
      }
      case "assistant": {
        const usage = r.message?.usage;
        for (const block of r.message?.content || []) {
          if (block.type === "text") {
            const ev = pushEvent({
              type: "assistant_message",
              timestamp: r.timestamp,
              actor: "assistant",
              tokens: usage
                ? { output: usage.output_tokens || 0, thinking: usage.output_tokens_details?.thinking_tokens || 0 }
                : null,
            });
            applyShape(ev, "text", block.text, TOOL_TEXT_MAX);
          } else if (block.type === "tool_use") {
            toolUseIdToName.set(block.id, block.name);
            const ev = pushEvent({
              type: "tool_call",
              timestamp: r.timestamp,
              tool_name: block.name,
            });
            toolUseIdToEventIndex.set(block.id, ev.index);
            applyShape(ev, "tool_input_summary", JSON.stringify(block.input ?? {}), TOOL_TEXT_MAX);
            if (block.name === "Skill" && block.input) {
              skillsInvoked.push({
                name: block.input.skill || block.input.name || null,
                via: "skill_tool",
              });
            }
          }
        }
        break;
      }
      case "attachment": {
        const at = r.attachment;
        if (!at || !KEPT_ATTACHMENT_TYPES.has(at.type)) break;
        const ev = pushEvent({ type: "system_context", timestamp: r.timestamp, attachment_type: at.type });
        if (at.type === "plan_mode") {
          planModeTransitions.push({ event_index: ev.index, plan_exists: !!at.planExists });
        }
        break;
      }
      case "permission-mode": {
        const ev = pushEvent({ type: "plan_mode_transition", timestamp: r.timestamp, to: r.permissionMode });
        planModeTransitions.push({ event_index: ev.index, to: r.permissionMode });
        break;
      }
      case "system": {
        if (r.subtype === "stop_hook_summary") {
          pushEvent({
            type: "stop_hook_summary",
            timestamp: r.timestamp,
            hook_count: r.hookCount,
            hook_errors: (r.hookErrors || []).length,
            prevented_continuation: !!r.preventedContinuation,
          });
          for (const info of r.hookInfos || []) {
            for (const hook of harnessHooks) {
              if (hook.event === "Stop" && hook.command === info.command) {
                const key = `${hook.event}:${hook.file}`;
                hookFireCounts.set(key, (hookFireCounts.get(key) || 0) + 1);
              }
            }
          }
        } else if (r.subtype === "local_command") {
          pushEvent({ type: "local_command_output", timestamp: r.timestamp, level: r.level });
        }
        // turn_duration / away_summary carry no harness signal we act on; skipped.
        break;
      }
      // queue-operation, last-prompt, mode, atis-latch, file-history-snapshot,
      // file-history-delta, agent-name: not emitted as events — either purely
      // redundant with a "user"/"ai-title" record (queue-operation) or not
      // relevant to harness-friction analysis.
      default:
        break;
    }
  }

  const hooksNotObservable = [];
  const hooksObservedFiring = [];
  for (const hook of harnessHooks) {
    const key = `${hook.event}:${hook.file}`;
    if (!hook.observable_in_transcript) {
      hooksNotObservable.push(key);
      continue;
    }
    if (hook.event === "UserPromptSubmit") {
      const literal = extractAdditionalContextLiteral(hook.source);
      let note;
      if (!hook.enabled) note = "hook disabled (0 active lines); no injection expected.";
      else if (!literal) note = "hook enabled but injected text could not be statically extracted; verify manually.";
      else note = "counted by matching this hook's literal injected text against user_message content.";
      hooksObservedFiring.push({ hook: key, count: hookFireCounts.get(key) || 0, note });
    } else if (hook.event === "Stop") {
      hooksObservedFiring.push({
        hook: key,
        count: hookFireCounts.get(key) || 0,
        note: "counted by matching stop_hook_summary hookInfos[].command against this hook's registered command.",
      });
    }
  }

  // Repeated failures on the same tool, regardless of adjacency.
  const failuresByTool = new Map();
  for (const err of toolErrors) {
    if (!err.tool_name) continue;
    if (!failuresByTool.has(err.tool_name)) failuresByTool.set(err.tool_name, []);
    failuresByTool.get(err.tool_name).push(err.event_index);
  }
  const repeatedFailedToolAttempts = [...failuresByTool.entries()]
    .filter(([, indices]) => indices.length >= 2)
    .map(([tool_name, indices]) => ({ tool_name, count: indices.length, event_indices: indices }));

  const userPromptCount = events.filter(
    (e) => e.type === "user_message" || e.type === "slash_command",
  ).length;
  const endedInError = events.length > 0 && events[events.length - 1].is_error === true;

  return {
    canonical_session_id_note: sessionIdMismatch,
    date: startTime ? startTime.slice(0, 10) : null,
    start_time: startTime,
    end_time: endTime,
    duration_ms: durationMs,
    entrypoint,
    cli_version: cliVersion,
    git_branch: gitBranch,
    models_used: modelsUsed,
    ai_title: aiTitle,
    cost_usd: costUsd,
    token_usage: tokenUsage,
    turn_count: events.length,
    user_prompt_count: userPromptCount,
    ended_in_error: endedInError,
    events,
    harness_signals: {
      hooks_observed_firing: hooksObservedFiring,
      hooks_not_observable: hooksNotObservable,
      skills_invoked: skillsInvoked,
      plan_mode_transitions: planModeTransitions,
      tool_errors: toolErrors,
      permission_denials: permissionDenials,
      repeated_failed_tool_attempts: repeatedFailedToolAttempts,
    },
    _agentSpawns: agentSpawns, // consumed by the caller, stripped before writing
  };
}

function processSubagents(logsDir, sessionId, harnessHooks, session, outDir, date) {
  const subagentsDir = join(logsDir, sessionId, "subagents");
  if (!existsSync(subagentsDir)) return [];
  const metaFiles = readdirSync(subagentsDir).filter((f) => f.endsWith(".meta.json"));
  const summaries = [];
  for (const metaFile of metaFiles) {
    const meta = JSON.parse(readFileSync(join(subagentsDir, metaFile), "utf8"));
    const agentId = metaFile.replace(/^agent-/, "").replace(/\.meta\.json$/, "");
    const transcriptPath = join(subagentsDir, `agent-${agentId}.jsonl`);
    const records = parseJsonlFile(transcriptPath);
    const subSession = buildSession(records, agentId, harnessHooks);
    delete subSession._agentSpawns;

    const toolUseCount = subSession.events.filter((e) => e.type === "tool_call").length;
    const lastAssistantMsg = [...subSession.events].reverse().find((e) => e.type === "assistant_message");
    const finalMessagePreview = lastAssistantMsg
      ? (lastAssistantMsg.text || lastAssistantMsg.preview || "").slice(0, FINAL_MESSAGE_PREVIEW_LEN)
      : null;

    const spawn = session._agentSpawns.get(agentId);
    const subOut = {
      agent_id: agentId,
      agent_type: meta.agentType,
      description: meta.description,
      spawn_depth: meta.spawnDepth,
      ...subSession,
    };

    const subagentOutPath = join(outDir, "sessions", date, sessionId, "subagents", `${agentId}.json`);
    mkdirSync(join(outDir, "sessions", date, sessionId, "subagents"), { recursive: true });
    writeFileSync(subagentOutPath, JSON.stringify(subOut, null, 2) + "\n");

    summaries.push({
      agent_id: agentId,
      agent_type: meta.agentType,
      description: meta.description,
      spawned_at_event_index: spawn ? spawn.eventIndex : null,
      tool_use_count: toolUseCount,
      duration_ms: subSession.duration_ms,
      final_message_preview: finalMessagePreview,
      file: `sessions/${date}/${sessionId}/subagents/${agentId}.json`,
    });
  }
  return summaries;
}

function main() {
  if (!existsSync(logsDir)) {
    process.stderr.write(`[generate-sessions] logs dir not found: ${logsDir}\n`);
    process.exit(1);
  }

  const harnessHooks = existsSync(harnessProjectDir) ? loadRegisteredHooks(harnessProjectDir) : [];

  const sessionFiles = readdirSync(logsDir).filter((f) => f.endsWith(".jsonl"));
  const indexEntries = [];

  for (const file of sessionFiles) {
    const sessionId = basename(file, ".jsonl");
    const records = parseJsonlFile(join(logsDir, file));
    if (records.length === 0) continue;

    const session = buildSession(records, sessionId, harnessHooks);
    const date = session.date || "unknown-date";
    const agentSpawns = session._agentSpawns;
    delete session._agentSpawns;

    const subagents = processSubagents(logsDir, sessionId, harnessHooks, { _agentSpawns: agentSpawns }, outputDir, date);
    session.subagents = subagents;

    const sessionOut = { session_id: sessionId, ...session };
    const sessionDir = join(outputDir, "sessions", date);
    mkdirSync(sessionDir, { recursive: true });
    const sessionPath = join(sessionDir, `${sessionId}.json`);
    writeFileSync(sessionPath, JSON.stringify(sessionOut, null, 2) + "\n");

    const hs = session.harness_signals;
    const toolErrorTools = [...new Set(hs.tool_errors.map((e) => e.tool_name).filter(Boolean))];
    const repeatedFailedTools = hs.repeated_failed_tool_attempts.map((a) => a.tool_name);
    const skillNames = hs.skills_invoked.map((s) => s.name).filter(Boolean);
    const hookFireCountsMap = Object.fromEntries(hs.hooks_observed_firing.map((h) => [h.hook, h.count]));

    const firstUserMessage = session.events.find((e) => e.type === "user_message");
    const firstPromptText = firstUserMessage?.text || firstUserMessage?.preview || null;

    indexEntries.push({
      session_id: sessionId,
      file: `sessions/${date}/${sessionId}.json`,
      date,
      ai_title: session.ai_title,
      first_prompt_preview: firstPromptText ? firstPromptText.slice(0, 200) : null,
      duration_ms: session.duration_ms,
      cost_usd: session.cost_usd,
      turn_count: session.turn_count,
      tool_error_count: hs.tool_errors.length,
      hit_plan_mode: hs.plan_mode_transitions.length > 0,
      subagent_count: subagents.length,
      harness_signals: {
        tool_error_tools: toolErrorTools,
        repeated_failed_tools: repeatedFailedTools,
        skills_invoked: skillNames,
        permission_denial_count: hs.permission_denials.length,
        hook_fire_counts: hookFireCountsMap,
        ended_in_error: session.ended_in_error,
      },
    });
  }

  indexEntries.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  const dates = indexEntries.map((e) => e.date).filter((d) => d !== "unknown-date");

  const hooksNotObservableStatic = harnessHooks
    .filter((h) => !h.observable_in_transcript)
    .map((h) => `${h.event}:${h.file}`);

  // No cross-session aggregation or clustering here on purpose: deciding what's
  // relevant across sessions (which ones are related, which patterns matter) is
  // an analysis judgment, not a mechanical rollup — see the "Analyze" step in
  // this skill's SKILL.md, which an LLM performs and persists as analysis.json.
  const index = {
    generated_at: new Date().toISOString(),
    logs_dir: logsDirForOutput,
    date_range: {
      from: dates[0] ?? null,
      to: dates[dates.length - 1] ?? null,
    },
    session_count: indexEntries.length,
    hooks_not_observable: hooksNotObservableStatic,
    sessions: indexEntries,
  };

  mkdirSync(outputDir, { recursive: true });
  writeFileSync(join(outputDir, "index.json"), JSON.stringify(index, null, 2) + "\n");

  console.log(`Processed ${indexEntries.length} session(s) from ${logsDir}`);
  console.log(`Wrote index to ${join(outputDir, "index.json")}`);
}

main();
