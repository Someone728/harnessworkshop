---
name: session-logs
description: Generate cleaned session data (index.json + per-session files) from raw Claude Code JSONL logs. Use when asked to build, run, or refresh the session-log extraction pipeline.
---

# Session Logs

Run the bundled script from the repo root:

```
node .claude/skills/session-logs/scripts/generate-sessions.mjs [logs-dir] [output-dir] [harness-project-dir]
```

- `logs-dir` defaults to this project's own raw log directory (computed from the
  current working directory using the same slugging rule Claude Code uses:
  `:` and path separators become `-`).
- `output-dir` defaults to `docs/log-schema`.
- `harness-project-dir` defaults to `todo-app` — used only to read
  `.claude/settings.json` there so `harness_signals` can name the actual registered
  hooks (not a generic guess).

This produces `index.json` + `sessions/{date}/{session_id}.json` (+ subagent files).
Everything in them is mechanical extraction — no LLM calls, no cross-session
judgment, no "this looks important" decisions. Specifically:

- Session identity, timestamps, models used, token/cost usage: read directly from the
  `cost-state`, `ai-title`, and `assistant` records (falling back to summing per-turn
  `message.usage` when no `cost-state` record exists yet — `cost_usd` stays `null`
  rather than guessing a price).
- Events are a line-by-line normalization of the raw records (user turns, tool
  calls/results, slash commands, plan-mode transitions, stop-hook summaries), with long
  text fields (over ~2000-4000 chars) replaced by a `preview` + `original_length_chars`.
- `harness_signals.hooks_observed_firing` for `UserPromptSubmit` hooks is computed by
  statically extracting the hook's injected literal string from its own source file
  and checking whether that exact substring appears in any user turn — a string
  match, not a semantic judgment. `Stop` hooks are matched via
  `stop_hook_summary.hookInfos[].command`. `PreToolUse`/`PostToolUse` hooks land in
  the top-level `hooks_not_observable` since their stdout/stderr isn't persisted in
  JSONL at all.
- `permission_denials`: a match on Claude Code's exact tool-rejection boilerplate
  ("The user doesn't want to proceed with this tool use. The tool use was
  rejected...") is tagged `confidence: "confirmed"` — verified against real denials
  found by running this script against another project's logs. A looser keyword
  regex is a fallback tagged `confidence: "heuristic"` — a lead, not a fact.
- Subagent transcripts (`{session_id}/subagents/*.jsonl`) are parsed identically and
  written to their own `sessions/{date}/{session_id}/subagents/{agent_id}.json`.
  `final_message_preview` on the parent's summary is a truncated excerpt, not a
  written summary.

`index.json` deliberately does **not** contain cross-session rollups, breakdowns, or
clustering — deciding what's relevant across sessions is an analysis judgment, not a
mechanical computation. Each session's index entry does carry a compact per-session
`harness_signals` summary (facts about *that* session only: `tool_error_tools`,
`repeated_failed_tools`, `skills_invoked`, `permission_denial_count`,
`hook_fire_counts`, `ended_in_error`), plus `ai_title` and a `first_prompt_preview` —
enough to scan across sessions without opening every session file individually.

If you add a new hook event type to this repo's harness beyond
`PreToolUse`/`PostToolUse`/`UserPromptSubmit`/`Stop`, update
`.claude/lib/hook-observability.mjs` (shared with the `harness-snapshot` skill) rather
than this script — both skills read hook classification from there.

Re-run this script any time raw logs change (regeneration is cheap and
side-effect-free).
