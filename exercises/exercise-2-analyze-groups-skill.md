# Exercise 2: From grouped sessions to reasoned findings
> tip: run /clear in your chat interface before starting the exercise to reset context.

From Exercise 1 you have `groups.json`: sessions clustered by real shared cause, each
tagged with a specific harness component, its control type, and supporting session
IDs. Missing: *why it matters*, *what to do about it*, *how sure you are*.

## Task

1. Enable plan mode and brainstorm the design with your agent before it writes
   anything — walk through the [design questions](#design-questions) below together,
   then have it build a new skill (e.g. `.claude/skills/analyze-groups/`) that reads `groups.json`,
   `harness-snapshot.json`, and `index.json`, and writes `analysis.json`: the same
   groups, each enriched with `why_it_matters`, `recommendation`, and `confidence`.
2. Make sure the skill you designed together specifies when it must escalate from a
   group's metadata to actually opening a `sessions/{date}/{id}.json` for evidence —
   `groups.json` alone is rarely enough to write a truthful `why_it_matters`.
3. Run the skill against your own (or the reference) `groups.json` and read the
   result. A `why_it_matters` that just restates the group's title in different words
   means the skill isn't escalating to real evidence — tighten it with your agent and
   run again.

This is a context-engineering exercise: when does the skill need real evidence (a
quoted error, a failed command, a decision the agent itself explained) instead of
just the metadata it started with?

## Why this isn't mechanical

Two groups pointing at the same file can need opposite treatment — a hook that's
fully commented out has an obvious fix, while two guide files giving contradictory
instructions don't, until you've read both and seen a session where the conflict
actually caused a problem. A `why_it_matters` written without opening session
evidence tends to just restate the group's title with more words; real reasoning
cites something specific — a quoted error, a rejected command, a line that changed
between two commits.

## Design questions

Talk through these with your agent, in plan mode, before it builds the skill:

1. **Context loading.** Is `groups.json` + `harness-snapshot.json` + `index.json`
   enough by default? When should the skill open a specific session file first?
2. **Confidence.** What separates "high" from "medium" from "low" — session count,
   how directly the evidence proves the claim, something else? Pick a rule you could
   apply consistently, not a vibe per finding.
3. **Recommendation specificity.** "Fix this" isn't a recommendation. What detail
   does someone unfamiliar with the group need to actually act on it?
4. **Consistency across findings.** If two findings imply contradictory changes
   (enable a hook vs. remove it), should the skill catch that, or is that a human
   reviewer's job?

## Success criteria

- Every `why_it_matters` cites something only readable from evidence (a session file,
  a quoted error, a specific line) — not the group's own metadata restated.
- `confidence` follows a rule you could explain to someone else, who'd land on the
  same level given the same group.
- Every `recommendation` is concrete enough to act on, and stays inside the harness's
  own files — not "tell the team to be more careful."
- The skill doesn't invent reasoning a group's evidence doesn't support.

## Solution

See [`exercises/README.md`](README.md#reference-solutions) for how to check out
reference solutions without exposing them to your coding agent.
`exercises/solutions/exercise02/` (on the `solutions` branch) has a reference skill
design (`analyze-groups-SKILL.md`) and the resulting `analysis.json`, built from
`exercises/solutions/exercise01/groups.json`. Attempt your own design first.
