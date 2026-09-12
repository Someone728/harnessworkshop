# HDR-0002: Keep AGENT.md's autonomy rules canonical; do not restore `post-edit-autocommit.js`

- **Status:** accepted
- **Date:** 2026-09-09
- **Deciders:** human (resolving the flagged conflict), `harness-fix-implementer`
- **Harness area:** instructions, hooks

## Context

`exercises/solutions/exercise02/analysis.json` groups 2 and 4 recommend two changes
that directly contradict each other:

- **Group 2** ("Disabled hooks and no Stop hook let a fixed regression ship again
  with zero verification") recommends restoring `todo-app/.claude/hooks/pre-read-format-check.js`
  and `prompt-plan-reminder.js`, adding a new `Stop` hook, and says: "Do not restore
  `todo-app/.claude/hooks/post-edit-autocommit.js` as part of this change without
  also resolving group 4."
- **Group 4** ("CLAUDE.md and AGENT.md give opposite instructions on running ahead
  vs waiting for approval after a plan") recommends making AGENT.md's "Autonomy"
  section canonical and deleting CLAUDE.md's "run with it rather than stopping to
  wait for a go-ahead" and "commit once a piece of work is in a reasonable state"
  bullets, and says this "conflicts with group 2's recommendation to restore
  `todo-app/.claude/hooks/post-edit-autocommit.js`, which would auto-commit after
  every Edit/Write and reintroduce exactly the automatic-commit behavior this
  recommendation removes from CLAUDE.md."

Per the `implement-harness-fix` skill's Step 3, a run against this dataset would not
implement either side of this pair — it would bundle the two contested actions
("restore `post-edit-autocommit.js`" from group 2; "delete CLAUDE.md's autonomy
bullets, make AGENT.md canonical" from group 4) into one draft PR stating both
options, and stop there. This HDR represents a human resolving that draft PR in a
later session by choosing group 4's side.

### Evidence

- **Baseline:** CLAUDE.md's "Working in this repo" section currently says to "put a
  plan together and run with it rather than stopping to wait for a go-ahead" and to
  "commit once a piece of work is in a reasonable state." AGENT.md's "Autonomy"
  section currently says to "write the plan and stop there — wait for them to say
  'go'" and "do not commit changes automatically." `post-edit-autocommit.js` is
  currently registered in `todo-app/.claude/settings.json` but fully commented out
  (0 active lines).
- **Observed evidence:** session `e6041b83` — the user said only "Plan it first," not
  "wait for my go-ahead," and the agent left plan mode citing CLAUDE.md ("CLAUDE.md
  says to run with a plan rather than wait for sign-off on it, so I'll implement that
  directly") directly against AGENT.md's wording. The same session later ran
  `git add -A && git commit -m "add versioned storage schema + migration, tidy
  naming"` unprompted, which the user rejected — a confirmed permission denial,
  i.e. a human actively blocking exactly the behavior CLAUDE.md's wording invited.
  Session `91d6f2a4` shows the opposite resolution of the identical fork in an
  otherwise similar session: there the agent asked "Want me to go with that?" and
  waited for "yes, go" before proceeding — evidence that which rule wins is
  unpredictable session to session, not evidence for which one *should* win on its
  own.
- **Relevant conditions:** both files already point at AGENT.md as the place for
  "additional/operating rules" (per group 4's `recommendation` text), which is why
  group 4's own proposed resolution treats AGENT.md as canonical rather than the
  reverse.

## Decision

1. Edit `todo-app/CLAUDE.md`'s "Working in this repo" section: delete "put a plan
   together and run with it rather than stopping to wait for a go-ahead" and "commit
   once a piece of work is in a reasonable state," replace both with a pointer to
   AGENT.md's Autonomy section, per group 4's `recommendation`.
2. Leave `todo-app/.claude/hooks/post-edit-autocommit.js`'s registration commented
   out / do not restore it — restoring it would auto-commit after every Edit/Write,
   which is exactly the behavior AGENT.md's "do not commit changes automatically"
   forbids.
3. Group 2's other two recommendations (restoring `pre-read-format-check.js` and
   `prompt-plan-reminder.js`, adding a new `Stop` hook) are unaffected by this
   decision and proceed independently — only the `post-edit-autocommit.js` sliver of
   group 2 was contested.

## Rationale

The only evidence in this dataset that speaks to which rule *should* win — as
opposed to merely documenting that the two disagree — is session `e6041b83`: a human
actively rejected the agent's unprompted auto-commit, a live instance of a human
overriding CLAUDE.md's wording in AGENT.md's favor. Session `91d6f2a4` shows the
opposite behavior occurring without any human pushback, but that session never
tested the auto-commit bullet specifically, only the wait-for-go-ahead one — it
doesn't provide comparable evidence either way on the commit question.

_Not recorded: the human resolving this conflict did not state any additional
reasoning beyond choosing group 4's side over group 2's — no rationale beyond the
`e6041b83` evidence above and the fact that both files already name AGENT.md as
canonical for operating rules was given in this session. This HDR does not supply
one on their behalf._

The alternative (group 2's side: restore `post-edit-autocommit.js`, make CLAUDE.md's
autonomy language canonical instead) was a real option — group 2's own recommendation
text proposes it — but implementing it would have required editing AGENT.md to
remove "do not commit changes automatically," and nothing in this dataset argues for
that direction specifically; the only concrete evidence (`e6041b83`) points the other
way.

## Expected effect

**Hypothesis:**
If we make AGENT.md's autonomy rules canonical and keep `post-edit-autocommit.js`
dead, the likelihood of an agent auto-committing without explicit approval, or
skipping a stop-for-approval point after presenting a plan, should decrease under
comparable conditions (a session where the user asks for a plan without further
qualifying whether to wait).

## Consequences

- **Positive:** removes the specific contradiction that produced `e6041b83`'s
  rejected auto-commit — an agent reading CLAUDE.md's "Working in this repo" section
  after this change is pointed at AGENT.md instead of given a competing instruction.
- **Negative:** slower iteration in sessions where the user would have been fine with
  the agent running ahead and committing — CLAUDE.md's removed bullets existed for a
  reason, even if that reason isn't recorded here.
- **Uncertain / possible regressions:** _Not recorded: no data in this dataset
  shows whether removing CLAUDE.md's autonomy bullets entirely (versus, say,
  softening them) changes behavior in sessions unlike `e6041b83`/`91d6f2a4`._

## Validation

- **Signal / metric:** whether future sessions that ask for "a plan" (without
  specifying wait-vs-run behavior) consistently stop for approval after the plan and
  never auto-commit, instead of varying session to session the way `e6041b83` and
  `91d6f2a4` did.
- **Evaluation method:** re-run the `analyze-groups` skill against future
  `harness-logs/` sessions and check whether a group matching this same
  contradiction pattern (two guide files disagreeing on autonomy) recurs.
- **Evaluation window:** the next 10 sessions that involve a plan-then-implement
  flow, or 30 days, whichever comes first.
- **Success criteria:** zero recurrences of a session where the agent cites CLAUDE.md
  to justify running ahead of an unresolved plan or auto-committing.
- **Reconsider / revert when:** a session shows a user explicitly wanting the
  auto-commit/run-ahead behavior back and being blocked by AGENT.md's current
  wording — that would be new evidence this decision doesn't have.
- **Regression signals:** any session where the agent skips a stop-for-approval point
  after a plan, or commits without being asked, despite this change.

### Revalidation triggers

- A future finding surfaces evidence (unlike anything in this dataset) that argues
  for the opposite resolution — e.g. a user explicitly asking for the old CLAUDE.md
  behavior back.
- `post-edit-autocommit.js` is proposed for restoration again for an unrelated
  reason (e.g. a different auto-commit policy that doesn't conflict with AGENT.md).

## Result

<!-- Complete after validation. Do not modify the original evidence, rationale, or hypothesis. -->

_Not recorded: no validation pass has been run against this HDR yet._
