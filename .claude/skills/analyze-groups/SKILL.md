---
name: analyze-groups
description: Enrich groups.json with why_it_matters, recommendation, and confidence, grounded in real session evidence rather than restated metadata. Use when asked to assess impact, write recommendations, or judge confidence for grouped harness-log findings.
---

# Analyze Groups

Grouping (the `session-logs` skill's Phase 2) names *what's wrong and where*. This
skill decides *why it matters*, *what to do about it*, and *how sure we are* — the
judgment calls grouping deliberately left out.

There is no bundled script. Every field this skill writes is a judgment call, so an
agent does the reading and writing directly — nothing here is mechanical extraction.

## What to read

- `groups.json` — the groups to enrich. Defaults to `docs/log-schema/groups.json`.
- `harness-snapshot.json` — the only place that confirms a component's actual current
  state (a hook's active line count, the literal CLAUDE.md/AGENT.md text, registered
  permissions). Defaults to `docs/log-schema/harness-snapshot.json`.
- `index.json` — per-session facts for every `evidence_session_ids` entry
  (`ai_title`, `harness_signals`, `tool_error_count`, `ended_in_error`). Defaults to
  `docs/log-schema/index.json`.

None of the three above is sufficient on its own to write a truthful
`why_it_matters`. They tell you a pattern exists; they don't give you a quote you can
cite as evidence for it.

## When to escalate to a session file

**Every group, no exceptions:** open at least one `sessions/{date}/{id}.json` from its
`evidence_session_ids` before writing `why_it_matters`. Pick the session most likely to
carry direct evidence — prefer, in order: `ended_in_error: true`, then highest
`tool_error_count`, then any session `index.json` flags with a nonzero
`hook_fire_counts` or `permission_denial_count` relevant to the group's
`harness_component`. Read its `events` and pull one concrete, quotable detail: the
literal error text, a command that got rejected, or a line where the agent explained a
decision it made.

If the group's claim spans a range of behavior (e.g. "quote style flips back and
forth"), open a second session from the same group and confirm the *same* mechanism
shows up there too, not a superficially similar but different problem — this also
feeds the confidence rule below.

`why_it_matters` fails if it could have been written from `groups.json` alone. A
rewritten title ("this causes duplicate validation logic") is not evidence; a quote or
specific observed behavior ("session `f95c8207` shows the agent switching from double
to single quotes mid-file after re-reading AGENT.md, with no error forcing the
change") is.

## What to write

Write `analysis.json` next to `groups.json` (same directory, so `docs/log-schema/` by
default):

```json
{
  "generated_at": "<ISO timestamp>",
  "based_on": { "groups": "groups.json" },
  "groups": [
    {
      "id": 1,
      "title": "Short label",
      "control_type": "guide | sensor | guide+sensor",
      "harness_component": "the specific file/setting this is about",
      "evidence_session_ids": ["..."],
      "why_it_matters": "Grounded in a quote or specific observed behavior from at least one opened session file.",
      "recommendation": "Names the exact file and the exact change to make there.",
      "confidence": "high | medium | low",
      "conflicts_with": [2]
    }
  ]
}
```

Copy `id`, `title`, `control_type`, `harness_component`, and `evidence_session_ids`
through unchanged from `groups.json` — this skill enriches groups, it doesn't
re-litigate them. `conflicts_with` is optional: omit it entirely unless the
cross-group pass below finds a real contradiction.

### `why_it_matters`

State the concrete consequence, citing the evidence you opened: what actually
happened, to whom or what, and why the named `harness_component` is the cause — not a
generic description of the category of problem.

### `confidence`

Judge on two axes, not a vibe:

- **Directness** — does an opened session show the mechanism actually firing (a
  quoted error caused *by* the named component), or is the link inferred from
  correlation?
- **Count** — does more than one independent session hit the same mechanism, or is
  there just one data point?

| | ≥2 sessions, same mechanism confirmed | Only 1 session confirmed |
|---|---|---|
| **Direct evidence + snapshot confirms component state unambiguously** (e.g. a hook has 0 active lines, a config path is provably wrong) | high | medium |
| **Evidence is correlational** (sessions share a symptom, but no single session demonstrates the named component caused it) | medium | low |

Never assign `high` on session count alone if you haven't confirmed directness in at
least one session, and never assign it on a single session no matter how direct the
evidence — a real recurring pattern needs more than one instance.

### `recommendation`

Name the exact file and the exact change — "add/remove/edit this text, in this file,
so it says this" — not "reconcile the guidance" or "fix the hook." Someone who has
never read the group's sessions should be able to act on it without asking a follow-up
question. Stay inside the harness's own files: `CLAUDE.md`, `AGENT.md`,
`.claude/hooks/*`, `.claude/settings.json`, `.claude/skills/*/SKILL.md`, or equivalent
under `todo-app/`. Never recommend an app source-code fix (that's what caused the
session in the first place, not the harness gap that let it happen) and never
recommend a process change outside the harness's own files ("tell the team to be more
careful" is not actionable here).

### Cross-group consistency pass

After every group has a draft `why_it_matters`/`recommendation`/`confidence`, do one
pass comparing all recommendations against each other. If two groups' recommendations
imply contradictory harness changes (one says enable/keep a component, another implies
removing or bypassing it), add `conflicts_with` (the other group's `id`) to both, and
say what the contradiction is inside each `recommendation` field as a trailing note.
Do not resolve the contradiction yourself or pick a side — that's a human reviewer's
call once both sides are visible in the same file. Most groups will have no conflict;
omit the field rather than force one.

## What separates real reasoning from restated metadata

- If you could write the field with `groups.json` closed, you haven't done the work —
  open a session file first.
- A `why_it_matters` that just rephrases `title` or `harness_component` in more words
  is a failure, even if it's accurate.
- `confidence` must be reproducible: someone else applying the same table to the same
  evidence should land on the same level. If you can't point to which cell of the
  table you're in, don't write the level yet — open another session first.
- A `recommendation` that would also make sense for a completely different group is
  too vague — it should be specific enough that it only fits this `harness_component`.
- Don't invent a `why_it_matters` or `recommendation` the opened evidence doesn't
  support. If the evidence is thin, that's what `confidence: "low"` is for — it is not
  license to write a more dramatic claim than the sessions back up.
