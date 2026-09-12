---
name: harness-snapshot
description: Generate or refresh the harness-snapshot.json artifact (CLAUDE.md/AGENT.md text, hook registration + enabled status, skills list, permissions) that the session-log analysis pipeline reads. Use when asked to create, update, or refresh a harness snapshot for docs/log-schema.
---

# Harness Snapshot

Produces `harness-snapshot.json` — a point-in-time capture of this repo's harness:
CLAUDE.md/AGENT.md text, each hook's registration plus enabled/disabled status, the
skill list, and permissions.

This repo separates the todo-app under analysis (`todo-app/`, including its own
`CLAUDE.md`, `AGENT.md`, `.claude/hooks`, `.claude/skills`) from this meta-tooling,
which lives at the repo root. Run the bundled script from the repo root to generate
the mechanical scaffold:

```
node .claude/skills/harness-snapshot/scripts/generate-harness-snapshot.mjs [project-dir] [output-path]
```

`project-dir` defaults to `todo-app` — the directory containing the harness being
analyzed. `output-path` defaults to `docs/log-schema/harness-snapshot.json`, resolved
relative to the current working directory (not `project-dir`). Pass a different
`project-dir` if the todo-app ever moves elsewhere.

The script only extracts structural facts: a hook counts as enabled if any non-comment,
non-blank line remains in its file; loc counts; the skill list read from each
SKILL.md's frontmatter; raw permissions from `.claude/settings.json`. Every hook and
skill entry also gets a `control_type: "guide" | "sensor"` field, per the org's
agent-harness framework (guides steer the agent before it acts — instructions,
skills, permissions; sensors observe after it acts — hooks). This classification is
static and structural (hooks are always sensors, skills/instructions/permissions are
always guides under this framework), not a judgment call, so the script sets it
directly rather than leaving it for manual review.

It deliberately leaves `instructions._note` as a generic placeholder, because judging whether
CLAUDE.md and AGENT.md actually contradict each other (or whether a referenced file
like SKILLS.md is missing) is a semantic call, not a mechanical one. After running the
script, read the CLAUDE.md/AGENT.md text in the generated file and, if you spot a real
contradiction or broken reference, replace the placeholder `_note` with a concrete one
— otherwise leave it as-is.

Also check each hook's `observability_note`: the script only has canned notes for
`PreToolUse`, `PostToolUse`, `UserPromptSubmit`, and `Stop`. If `.claude/settings.json`
registers a hook event outside that set, its note will read "verify manually" — replace
it with a real explanation of whether that event's output is observable in session
JSONL transcripts.
