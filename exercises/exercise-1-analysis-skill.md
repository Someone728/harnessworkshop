# Exercise 1: From mechanical extraction to real analysis

The `session-logs` skill only mechanically extracts data today. Your task: add a
second phase where an agent actually reads that data and writes down real findings.

## Setup

Run both scripts from the repo root (or let your agent do this for you), pointing at the fabricated dataset in
`harness-logs/`:

```
node .claude/skills/harness-snapshot/scripts/generate-harness-snapshot.mjs todo-app docs/log-schema/harness-snapshot.json
node .claude/skills/session-logs/scripts/generate-sessions.mjs harness-logs docs/log-schema todo-app
```

This writes `docs/log-schema/harness-snapshot.json` and `docs/log-schema/index.json`
(+ `docs/log-schema/sessions/{date}/{id}.json`). Everything in them is rule-based
extraction — string matching, counting, truncation. No model call anywhere. Open
`index.json` — that, plus `harness-snapshot.json`, is all you're handed.

## Task

1. Read `harness-snapshot.json` and every session's compact entry in `index.json`
   (`ai_title`, `first_prompt_preview`, `harness_signals`). Open an individual
   `sessions/{date}/{id}.json` only when something looks worth a closer read.
2. Decide which sessions show that something in the harness needs to change, and
   what.
3. Update `.claude/skills/session-logs/SKILL.md` to add a "Phase 2: Analyze" step
   describing what you just did in steps 1-2, so the next person running this skill
   does the same thing.
4. Write `docs/log-schema/analysis.json` with your findings, using the schema below.

### Finding schema

```json
{
  "generated_at": "<ISO timestamp>",
  "based_on": { "harness_snapshot": "harness-snapshot.json", "index": "index.json" },
  "findings": [
    {
      "id": 1,
      "title": "Short label",
      "control_type": "guide | sensor | guide+sensor",
      "harness_component": "the specific file/setting this is about",
      "evidence_session_ids": ["..."],
      "why_it_matters": "the reasoning connecting evidence to the gap — not a restated count",
      "recommendation": "a concrete, specific change",
      "confidence": "high | medium | low"
    }
  ]
}
```

### Rules for a real finding

- **Group by meaning, not shared words.** Two sessions about the same recurring ask
  are one finding, even if worded completely differently. Don't group sessions just
  because they share vocabulary.
- **Name a specific harness component** — an actual hook file, an actual CLAUDE.md
  section, an actual permissions entry. "Something seems off" isn't a finding.
- **Go beyond `index.json` when a count looks interesting.** Open the relevant
  `sessions/{date}/{id}.json` and check the actual `tool_input_summary`/
  `error_preview` — that's usually where the root cause is, not in the count.
- **Prioritize by impact, not session count.** One confirmed permission denial that
  reveals a missing guardrail can matter more than ten sessions sharing a topic.
- **Don't pad to hit a quota.** Two solid findings beat five weak ones.

## Why not just compute this mechanically?

Already tried, in this repo's own history: a keyword-overlap heuristic across
`ai_title`/first-prompt text merged two unrelated sessions because both happened to
contain "agent" and "workshop" — words that are structurally common in a workshop
*about* agent harnesses, not evidence the sessions were related. Tuning the threshold
just moves where the next false merge happens. Worse, a rollup can tell you "5
sessions hit a tool error" but can't tell you *why* — that all 5 were hallucinated
file paths from a different environment, say — because noticing that pattern requires
actually reading the failed calls. Deciding what's relevant is a judgment call; it
belongs in a phase where an agent reads and reasons, and writes the result down.

## Self-check

- Could someone who's never seen the raw logs read only `analysis.json` and know
  exactly which file to open and what to check?
- Is at least one finding something you could **not** have written from
  `index.json`'s counts alone?
- If two findings recommend contradictory changes, did you say so?

## Solution

`exercises/solutions/exercise01/` has the reference `harness-snapshot.json`,
`index.json`, `sessions/`, and `analysis.json` for this same `harness-logs/` dataset,
plus `exercises/solutions/session-logs-phase-2.md` for the reference Phase 2
instructions. Don't open these before attempting the exercise — compare after.
Differences in wording are fine; differences in whether a finding is concrete,
evidenced, and reasoned are what to check for.
