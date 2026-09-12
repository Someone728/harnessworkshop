# Exercise 1: From mechanical extraction to real grouping

You have `harness-logs/`: two weeks of real session transcripts from an agent working
in `todo-app/` (see [MISSION_BRIEFING.md](../MISSION_BRIEFING.md) if you haven't read
it). Nobody has gone back and read them yet.

This repo already has a `session-logs` skill (`.claude/skills/session-logs/`) that
turns those raw transcripts into two structured files — `harness-snapshot.json` (what
the harness currently is) and `index.json` (per-session facts: tool errors, hook
fires, permission denials). But it stops there — deciding which sessions are actually
about the same underlying problem is a judgment call, not a mechanical one, and
nobody has added it yet.

Your task: add a second phase to the skill where an agent reads the extracted data
and groups sessions by real, shared cause — not by shared vocabulary.

This exercise is scoped to grouping only: naming *what's wrong and where*, backed by
real sessions. Why it matters, what to do about it, how confident you are — that's
Exercise 2. Don't write recommendations here.

## Task

1. Run the `harness-snapshot` and `session-logs` skills. Their defaults already point
   at this repo's fabricated dataset (`todo-app`, `harness-logs`,
   `docs/log-schema`), so no arguments are needed. This produces
   `docs/log-schema/harness-snapshot.json`, `docs/log-schema/index.json`, and
   `docs/log-schema/sessions/{date}/{id}.json`. Everything in them is rule-based
   extraction — string matching, counting, truncation. No model call anywhere.
2. Skim `harness-snapshot.json` and index.json's per-session entries (`ai_title`,
   `first_prompt_preview`, `harness_signals`). You're not expected to read every
   entry closely or open every session file — inspect enough to notice which
   sessions look like they share a cause, and open a `sessions/{date}/{id}.json`
   only to confirm a specific hunch. Do this yourself or have your agent do it while
   you steer; either is fine.
3. From that skim, decide roughly which sessions belong together and which part of
   the harness each group implicates. This doesn't need to be exhaustive or final —
   step 5 is where you check it against what your agent actually produces.
4. Add a `## Phase 2: Group` section to `.claude/skills/session-logs/SKILL.md`,
   right after Phase 1. Enable plan mode and design it with your agent instead of
   handing off the whole thing: does it tell a reader who isn't you what to read,
   what to write and where, and what makes a group real instead of keyword
   clustering? At minimum it must specify:
   - **What to read**: `harness-snapshot.json`, every `index.json` entry, and when to
     open a specific `sessions/{date}/{id}.json` to confirm two sessions are the same
     issue rather than just similarly worded.
   - **What to write, and where**: `groups.json` next to `index.json`, with each
     group carrying the four fields from the schema below — `title`,
     `control_type`, `harness_component`, `evidence_session_ids` — or an equivalent
     that forces the same specifics.
   - **What makes a group real**: fold the "Rules for a real group" below into the
     section as instructions, not a description of what you did.
5. Run the `session-logs` skill again to produce `groups.json`.
   Compare the result against your own read from step 3. Inspect this file and see
   if it matches your expectations from step 3.

### Group schema

```json
{
  "generated_at": "<ISO timestamp>",
  "based_on": { "harness_snapshot": "harness-snapshot.json", "index": "index.json" },
  "groups": [
    {
      "id": 1,
      "title": "Short label",
      "control_type": "guide | sensor | guide+sensor",
      "harness_component": "the specific file/setting this is about",
      "evidence_session_ids": ["..."]
    }
  ]
}
```

### Rules for a real group

- **Group by meaning, not shared words.** Two sessions about the same recurring ask
  are one group, even if worded completely differently.
- **Name a specific harness component and control type** — an actual hook file, an
  actual CLAUDE.md section, an actual permissions entry. "Something seems off" isn't a
  group.
- **Confirm ambiguous groupings by reading, not guessing.** If two sessions might or
  might not be the same issue, open the relevant `sessions/{date}/{id}.json` and check
  the actual `tool_input_summary`/`error_preview` — that's usually where you can tell
  for certain, not in the `index.json` summary.
- **Don't force it.** Don't pad a group with sessions that don't really belong, and
  don't split one real recurring issue into multiple groups just because the wording
  differs session to session.

## Success criteria

- Every group in `groups.json` fills all four schema fields with real values: a
  `title`, a `control_type` that's actually `guide`, `sensor`, or `guide+sensor`, a
  `harness_component` naming one specific file or setting, and `evidence_session_ids`
  that are real IDs from `index.json` — no vague "something seems off" groups.
- `SKILL.md`'s Phase 2 section is instructions an agent can follow on its own, not a
  log of what you did this one time.
- Your agent produced `groups.json` by following those instructions — you didn't
  hand-write it to match your own earlier read.
- At least one `evidence_session_ids` entry required opening that session's file to
  confirm — something `index.json`'s summary alone couldn't tell you.
- No group exists purely because sessions share vocabulary, and no real recurring
  issue got split into two groups by wording differences.
- Someone who's never seen the raw logs could read only `groups.json` and know
  exactly which sessions and which harness file each group is about.
- You resisted adding `why_it_matters`, `recommendation`, or `confidence` here —
  that's Exercise 2's job, and adding it now means guessing without the tools
  Exercise 2 gives you to do it properly.

## Solution

See [`exercises/README.md`](README.md#reference-solutions) for how to check out
reference solutions without exposing them to your coding agent.
`exercises/solutions/exercise01/` (on the `solutions` branch) has the reference
`harness-snapshot.json`, `index.json`, `sessions/`, and `groups.json` for this same
`harness-logs/` dataset, plus `session-logs-phase-2-group.md` for the reference Phase
2 instructions. Don't look before attempting the exercise; compare after. Differences
in wording are fine; differences in whether a group is concrete, evidenced, and
correctly scoped are what to check for.
