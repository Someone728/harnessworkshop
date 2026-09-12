// Shared logic for reading a project's registered hooks (.claude/settings.json)
// and classifying which hook events leave an observable trace in session JSONL
// transcripts. Used by the harness-snapshot and session-logs skills so both agree
// on what's actually detectable from raw logs.

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export const HOOK_EVENT_OBSERVABILITY = {
  UserPromptSubmit: {
    observable: true,
    note: () =>
      "If enabled, this hook's hookSpecificOutput.additionalContext is injected inline ahead of the next user turn and IS visible in the transcript (as a hook_injection event).",
  },
  Stop: {
    observable: true,
    note: () =>
      "Stop hooks surface via a system/stop_hook_summary record (hookInfos, hookErrors, preventedContinuation) even when they produce no additionalContext.",
  },
  PreToolUse: {
    observable: false,
    note: () =>
      "PreToolUse hook stdout/stderr is not persisted in session JSONL; enabled/disabled status can only be determined by reading this file, not by scanning transcripts.",
  },
  PostToolUse: {
    observable: false,
    note: () =>
      "PostToolUse hook stdout/stderr and side effects are not observable from the transcript alone; correlate this hook's tool_call timestamps against external state (e.g. git log) if you need to confirm it fired.",
  },
};

export function classifyHookEvent(event) {
  return (
    HOOK_EVENT_OBSERVABILITY[event] ?? {
      observable: false,
      note: () =>
        `Observability for '${event}' hooks is not yet characterized; verify manually.`,
    }
  );
}

export function extractHookCommands(hooksBlock) {
  const results = [];
  for (const [event, entries] of Object.entries(hooksBlock || {})) {
    for (const entry of entries) {
      const matcher = entry.matcher ?? null;
      for (const hook of entry.hooks || []) {
        if (hook.type === "command") {
          results.push({ event, matcher, command: hook.command });
        }
      }
    }
  }
  return results;
}

export function commandToRelFile(command) {
  const match = command.match(/\.claude[\\/]hooks[\\/][^"'\s]+\.js/);
  return match ? match[0].replace(/\\/g, "/") : null;
}

export function analyzeHookFile(projectDir, relFile) {
  const abs = join(projectDir, relFile);
  if (!existsSync(abs)) return { locActive: 0, locTotal: 0, source: null };
  const source = readFileSync(abs, "utf8");
  const lines = source.split("\n");
  let locTotal = 0;
  let locActive = 0;
  for (const raw of lines) {
    const line = raw.trim();
    if (line === "") continue;
    locTotal++;
    if (!line.startsWith("//")) locActive++;
  }
  return { locActive, locTotal, source };
}

// Reads {projectDir}/.claude/settings.json and returns each registered hook with
// its file, enabled status, and observability classification.
export function loadRegisteredHooks(projectDir) {
  const settingsPath = join(projectDir, ".claude/settings.json");
  const settings = existsSync(settingsPath)
    ? JSON.parse(readFileSync(settingsPath, "utf8"))
    : {};
  return extractHookCommands(settings.hooks).map(
    ({ event, matcher, command }) => {
      const file = commandToRelFile(command);
      const { locActive, locTotal, source } = file
        ? analyzeHookFile(projectDir, file)
        : { locActive: 0, locTotal: 0, source: null };
      const observability = classifyHookEvent(event);
      return {
        file,
        event,
        matcher,
        command,
        enabled: locActive > 0,
        loc_active: locActive,
        loc_total: locTotal,
        observable_in_transcript: observability.observable,
        observability_note: observability.note(),
        // Guide/Sensor duality: guides steer the agent before it acts (CLAUDE.md,
        // domain context, permissions, skills); sensors observe after it acts.
        // Hooks are always sensors under this framing, regardless of event type.
        control_type: "sensor",
        source,
      };
    },
  );
}

// Best-effort static extraction of a UserPromptSubmit hook's injected text, by
// looking for `additionalContext: '...'` (single/double/backtick quoted) in its
// source. Returns null if the pattern can't be matched (e.g. the hook is disabled
// and the literal is commented out, or it builds the string dynamically) —
// deterministic, no guessing beyond this literal regex.
export function extractAdditionalContextLiteral(source) {
  if (!source) return null;
  const match = source.match(/additionalContext:\s*\n?\s*['"`]([^'"`]+)['"`]/);
  return match ? match[1] : null;
}
