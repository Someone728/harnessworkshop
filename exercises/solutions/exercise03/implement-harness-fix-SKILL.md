---
name: implement-harness-fix
description: Reads analysis.json findings, classifies each by how safe it is to act on, and for the safe ones actually implements the change and opens a PR. Never guesses at a policy decision or an unobservable fact.
---

# Solution reference: `implement-harness-fix` (Exercise 3)

This is a reference implementation of the skill and restricted agent Exercise 3 asks
you to design. Compare against your own — differences in wording are fine,
differences in *whether the write-restriction actually holds* and *whether a policy
decision ever gets silently guessed at* are the thing to check.

## The restricted agent (design this first)

See `harness-fix-implementer-AGENT.md` in this same folder for the actual subagent
definition, and `harness-fix-scope-guard.js` for the hook that enforces it. The short
version: a `PreToolUse` hook checks the tool call's `agent_type` field — present when
the call originates from a subagent, naming which one — and blocks `Edit`/`Write` on
`todo-app/src/**` only when `agent_type === "harness-fix-implementer"`. That's the
hard enforcement, and it's scoped to this one agent specifically.

A project-level `permissions.deny` rule was the first thing we considered and the
wrong answer: it applies to every session and every agent in the repo, not just this
one — it would have blocked the main session (and every other agent) from ever
editing `todo-app/src/**`, breaking normal work everywhere else in the workshop. The
hook is the only mechanism that's actually scoped to a single agent, because it's the
only one that can see *who's calling* before deciding whether to block.

The subagent definition on top of that scopes which tools this specific job gets in
the first place (no reason for an implementer agent to have web access, for instance)
and states the restriction in its own system prompt, so the constraint is visible to
anyone reading the agent definition, not just discoverable by hitting a blocked call.

Registration, in `.claude/settings.json` — same as any other hook, project-wide by
registration even though its effect is scoped by the check inside the script:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          { "type": "command", "command": "node \"$CLAUDE_PROJECT_DIR/.claude/hooks/harness-fix-scope-guard.js\"" }
        ]
      }
    ]
  }
}
```

## Context loading

1. Always load `analysis.json`, `harness-snapshot.json`, and `index.json`. Under 15KB
   total for a dataset this size — no reason to summarize or partially load them.
2. Before implementing anything, sanity-check the inputs:
   - Every `evidence_session_ids` entry in every finding must exist as a `session_id`
     in `index.json`. If one doesn't, drop that finding and say so in the output
     instead of acting on it.
   - Every path named in a finding's `harness_component` should actually appear in
     `harness-snapshot.json` (or exist on disk). If it doesn't, treat the finding as
     stale — refuse it, and say why.
3. Only open a specific `sessions/{date}/{id}.json` file if a finding's evidence needs
   verification beyond what `analysis.json`'s `why_it_matters` already gives you.

## Classifying each finding: `fix_type`

Computed fresh by this skill, per finding, not stored back into `analysis.json`.

- **`mechanical`** — the fix is a direct patch to the exact file/setting named in
  `harness_component`, checkable by re-reading that same file, and doesn't require
  choosing between two legitimate preferences absent from the data. **Actually
  implement it**: make the edit, commit, open a PR.
- **`policy_decision`** — the diagnosis is solid, but the fix depends on a preference
  or precedence that isn't recorded anywhere in the input files (which guide wins,
  whether to accept a new dependency). **Do not implement anything.** Report the
  options with tradeoffs — either as a comment/issue, or a draft PR whose body states
  the decision needed, never one that picks silently.
- **`needs_investigation`** — the finding points at something outside these files
  entirely (an external system, an unconfirmed real-world fact). **Do not touch
  anything.** Report a named next step.

Before implementing a `mechanical` finding, check whether its fix would actually
require touching `todo-app/src/**` despite looking mechanical on paper — the hook
should catch this even if the classification step doesn't. In this dataset, no
finding's fix reaches into `src/**`, but don't assume that'll always be true: check it
every time, not just when it happens to matter here.

## Output

For implemented findings: a real commit and PR, plus an entry in
`applied-changes.json` recording what was done and why. For flagged findings: an
entry recording the refusal and the reason — never silently dropped. See
`applied-changes.json` for the worked example against
`../exercise02/analysis.json`.

## Cross-finding awareness

Before finalizing, check whether any two actions conflict (implementing one thing that
another finding's still-open policy decision would undo). If so, make the dependency
explicit with a `blocked_by` reference and don't implement the blocked one yet.
