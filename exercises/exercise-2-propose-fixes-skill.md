# Exercise 2: A skill that proposes harness fixes

From Exercise 1 you have three artifacts: `harness-snapshot.json` (what the harness
*is*), `index.json` (per-session mechanical facts), `analysis.json` (real findings —
component, evidence, reasoning, recommendation, confidence).

## Task

Build a new skill, e.g. `.claude/skills/propose-harness-fixes/`, that takes those
three files and produces a concrete, reviewable set of proposed harness changes. It
must **propose only — never apply a fix itself.** A human reviews and decides.

This is a context-engineering exercise: which files does the skill load, in what
order, and when does it go back for more evidence before proposing something?

## Why you can't just hand it `analysis.json` and say "fix these"

Walk through `exercises/solutions/exercise01/analysis.json` (the Exercise 1 reference
output) and notice the findings aren't equally safe to act on:

- **Mechanically verifiable.** E.g. "this hook is registered but every line is
  commented out" — checkable against the same file the finding cites. Safe to
  propose a concrete diff.
- **Correct diagnosis, fix needs a human decision.** E.g. two guide files give
  opposite instructions on autonomy — airtight finding, but *which* policy should win
  isn't in the data anywhere. An agent that picks one silently is guessing.
- **Correct diagnosis, fix touches something unobservable.** E.g. a recurring failure
  depends on which shell/OS the team actually uses — something not settled by
  anything in these three files. Proposing a patch here isn't a fix, it's a guess.

A skill that treats all three the same and just starts writing patches will produce
some good fixes and some confidently wrong ones, indistinguishable from the output
alone.

## Design questions

1. **Context loading.** Is `harness-snapshot.json` + `index.json` + `analysis.json`
   enough by default? When should the skill escalate to a specific
   `sessions/{date}/{id}.json` for more evidence before proposing something?
2. **Classifying the three categories above**, before proposing anything. Does
   `analysis.json`'s schema need a new field for this (e.g.
   `fix_type: "mechanical" | "policy_decision" | "needs_investigation"`) — and if so,
   is it set during Exercise 1's analysis, or computed by this new skill?
3. **Proposal shape per category.** A mechanical finding gets an actual diff. A
   policy-decision finding gets two labeled options with tradeoffs, not a patch. A
   needs-investigation finding gets a named next step, not a fix attempt.
4. **Refusing bad input.** What happens if `analysis.json` is stale, or a finding's
   `evidence_session_ids` don't exist in `index.json`? Should the skill sanity-check
   its inputs before proposing anything from them?

## Success criteria

- Given the same three input files, a reviewer can tell — for each proposal —
  whether it's safe to apply as-is, a decision they need to make, or something that
  needs more digging, without re-deriving that themselves.
- The skill never edits the harness directly; it writes proposals.
- Feed it `exercises/solutions/exercise01/analysis.json` (or your own from Exercise 1)
  and check whether its proposals actually match the three categories above — or
  whether it treats a policy decision as if it were mechanical.

## Solution

`exercises/solutions/exercise02/` has a reference skill design
(`propose-harness-fixes-SKILL.md`) and an example `proposals-workshop.json` run
against `exercises/solutions/exercise01/`. Attempt your own design first — this one's
meant for comparison, not copying.
