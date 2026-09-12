# Workshop exercises

## Fast track (~20 minutes)

> **In a hurry?** Full track is ~60 minutes for all five exercises. Fast track is
> ~20 minutes: paste the prompt below to your coding agent to fully complete
> exercises 1–2 for you, then start on
> [exercise 3](exercise-3-implement-harness-fix.md) yourself. It doesn't just copy
> the reference JSON in — it installs the reference skills and actually runs them
> against `harness-logs/`, so you still see the Phase 2 grouping and the
> `analyze-groups` skill produce real output, just without doing the design work
> yourself.
>
> Tip: run `/effort low` before pasting the prompt. It answers faster and
> shallower — plenty for this workshop — instead of spending extra time on
> depth you don't need here.
>
> ```
> Fetch the `solutions` branch (git fetch origin solutions) — don't check it out
> or create a worktree, stay on the current branch. Use
> `git show origin/solutions:<path>` to read files straight out of that branch.
> Copy the content of
> exercises/solutions/exercise01/session-logs-phase-2-group.md in as a new
> "## Phase 2: Group" section in .claude/skills/session-logs/SKILL.md, right after
> its Phase 1 section. Copy exercises/solutions/exercise02/analyze-groups-SKILL.md
> in as a new skill at .claude/skills/analyze-groups/SKILL.md. Then run the
> session-logs skill (producing groups.json alongside index.json) and the
> analyze-groups skill (producing analysis.json). Report the paths of everything you created.
> ```
>
> Afterwards you'll have `.claude/skills/session-logs/` with its Phase 2 section,
> a new `.claude/skills/analyze-groups/` skill, and real `groups.json`/`analysis.json`
> for this repo's `harness-logs/` dataset — ready for
> [exercise 3](exercise-3-implement-harness-fix.md).

## All exercises

All exercises analyze (and eventually act on) the same fabricated dataset:
`harness-logs/` (11 raw session transcripts for the `todo-app/` TODO app). Five
exercises in total, meant to be done in order — from raw evidence to an actual
reviewed and validated harness fix:

```
harness-logs/ → [1: Group] → groups.json → [2: Analyze] → analysis.json
  → [3: Implement] → PR (diff) → [4: Document] → PR (+ HDR)
  → [5: Validate] → PR (+ validation) → human approves
```

1. **(light)** [`exercise-1-analysis-skill.md`](exercise-1-analysis-skill.md) — the
   `session-logs` skill currently only mechanically extracts `index.json` and
   `harness-snapshot.json`. Add a "Phase 2: Group" step that turns those into
   `groups.json`: sessions clustered by real shared cause, each naming a specific
   harness component and control type. Grouping only — no reasoning yet. A solution
   exists — see "Reference solutions" below — don't open it before attempting the
   exercise.

2. **(medium)** [`exercise-2-analyze-groups-skill.md`](exercise-2-analyze-groups-skill.md) — build
   a new skill that takes `groups.json` (+ `harness-snapshot.json` + `index.json`)
   and produces `analysis.json`: the same groups, enriched with `why_it_matters`, a
   `recommendation`, and a `confidence` level. About context engineering: when the
   skill needs to escalate from a group's metadata to a specific session file to
   write reasoning that's actually true, not just restated. A reference solution
   exists — see "Reference solutions" below.

3. **(heavy — budget the most time here)** [`exercise-3-implement-harness-fix.md`](exercise-3-implement-harness-fix.md) —
   take `analysis.json` and actually change the harness: build a skill that
   classifies each finding (safe to implement directly, needs a human decision, or
   needs more investigation) and, for the safe ones, makes the change and opens a
   PR — run by a dedicated agent that's denied write access to `todo-app/src/**`
   (production code) and can only touch the harness itself. A reference solution
   exists — see "Reference solutions" below.

4. **(medium)** [`exercise-4-hdr.md`](exercise-4-hdr.md) — extend the Exercise 3 flow to decide
   whether a change warrants a **Harness Decision Record** (the harness equivalent
   of an ADR — why the change was made, not just what changed) using
   [`hdr-template.md`](hdr-template.md), and to ship it in the same PR.

5. **(medium)** [`exercise-5-validation.md`](exercise-5-validation.md) — add a validation phase
   that runs *before* the PR from Exercises 3/4 reaches a human reviewer: checking
   the change against its own evidence chain (finding, proposal, diff, HDR) without
   spinning up new agent sessions to test it. Reports what it could and couldn't
   establish — it never approves its own change.

## Reference solutions

Reference solutions live on the **`solutions` branch, not on `master`** — kept off
the branch you work in so a coding agent helping with an exercise never has them in
its working tree. Check the branch out into a separate directory when you're ready to
compare, never into the directory your agent is operating in:

```
git fetch origin solutions
git worktree add ../workshop-solutions solutions
```

Open `../workshop-solutions/exercises/solutions/...` yourself, in an editor — don't
point your agent at that worktree, and don't look before attempting the exercise.
Remove it when you're done: `git worktree remove ../workshop-solutions`.

`master`'s own `.claude/settings.json` also denies the `Read`/`Grep`/`Glob` tools from
touching `exercises/solutions/**` as a second layer, in case solution files ever end
up copied into your working tree anyway.
