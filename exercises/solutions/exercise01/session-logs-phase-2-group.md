# Solution reference: `session-logs` Phase 2 (Exercise 1)

This is the "Phase 2: Group" section as it existed in the built solution's
`.claude/skills/session-logs/SKILL.md`, before the skill was stripped back to a
Phase-1-only starter for the workshop. Use this to compare against your own
Exercise 1 attempt — not to copy in before you've tried it yourself.

The corresponding example output is `exercises/solutions/exercise01/groups.json`,
generated against this repo's own `harness-logs/` dataset. Note what it does *not*
contain: no `why_it_matters`, no `recommendation`, no `confidence`. That reasoning is
Exercise 2's job, built from this output plus further reading — not this phase's.

---

## Phase 2: Group

Phase 1 deliberately stops at mechanical extraction. Phase 2 is the judgment call it
leaves undone: read what Phase 1 produced and decide which sessions are really about
the same underlying harness problem — not which sessions merely use similar words.

### What to read

- `harness-snapshot.json` in full. It's the only place that tells you which hooks,
  skills, and instruction files actually exist and whether they're enabled — you need
  it to name a real `harness_component` instead of guessing one.
- Every session's compact entry in `index.json` (`ai_title`, `first_prompt_preview`,
  `harness_signals`) — all of them, before you form any group. A recurring pattern is
  often invisible in a single entry and only shows up once you've scanned the whole
  set.
- An individual `sessions/{date}/{session_id}.json` whenever two or more sessions
  might share a root cause but you can't be sure from the index alone — e.g. the same
  symptom described in different words, the same tool erroring but an unclear cause,
  or a regression you suspect traces back to an earlier "fix." Read the actual
  `tool_input_summary` / `error_preview` / event text there. Never decide a merge or a
  split on a guess — if you're not sure, open the file and check.

### What to write

Write `groups.json` in the same directory as `index.json`:

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

Every group must:

- Name one specific `harness_component` — an actual file path or setting from
  `harness-snapshot.json` (a hook file, a CLAUDE.md/AGENT.md section, a skill, a
  permissions entry). Never a vague area like "tooling" or "instructions."
- Set `control_type` to `guide` (instructions, skills, permissions — steer the agent
  before it acts), `sensor` (hooks — observe or react after it acts), or `guide+sensor`
  when both a guide and a sensor contribute to the same underlying problem.
- List only `evidence_session_ids` you actually confirmed belong — not every session
  that happens to mention similar words.

A session that doesn't clearly share a root cause with any other session stays out of
`groups.json` entirely. Don't invent a group to hold leftovers, and don't force a
weakly-related session into an existing group just to give it a home.

### What separates a real group from keyword clustering

- Group by shared root cause, not shared vocabulary. Two sessions worded completely
  differently are the same group if they trace back to the same harness component.
  Two sessions that reuse the same nouns are *not* the same group if they trace back to
  different components.
- A group must point at a component you can actually name from `harness-snapshot.json`
  or the codebase. "Something seems off with formatting" is not a group;
  "`code-formatter` and `style-consistency` overlap in scope and nothing re-enforces
  the convention between sessions" is.
- Before merging sessions into one group, open at least one underlying
  `sessions/{date}/{session_id}.json` and check whether the actual mechanism — which
  tool failed, which file was touched, which hook or skill fired — matches. Don't merge
  on the strength of similar-sounding `ai_title`/`first_prompt_preview` text alone.
- Before treating similar-sounding sessions as separate groups, do the same check in
  reverse: confirm they're genuinely different root causes, not one recurring issue
  described two different ways.
- Don't pad a group with sessions that don't really belong, and don't split one real
  recurring issue into multiple groups just because the wording drifted from session to
  session.
- Do not add `why_it_matters`, `recommendation`, or `confidence` fields. Grouping only
  names what's wrong and where — assessing impact and deciding what to do about it
  comes later, once the grouping itself is trustworthy.
