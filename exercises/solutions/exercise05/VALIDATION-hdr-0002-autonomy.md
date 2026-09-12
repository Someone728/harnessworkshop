# Validation: HDR-0002 (AGENT.md wins on autonomy)

Worked example of the `## Validation` section a PR resolving the
`conflicts_with` link between `exercises/solutions/exercise02/analysis.json` groups
2 and 4 would carry, per the full path — an HDR was warranted (a `conflicts_with`
resolution), so all six checks run. Validates
`exercises/solutions/exercise04/HDR-0002-agent-md-wins-on-autonomy.md` and the diff
it documents.

- **Finding:** groups 2 & 4 (mutual `conflicts_with`).
- **HDR:** `HDR-0002-agent-md-wins-on-autonomy.md`.
- **Diff validated:** `todo-app/CLAUDE.md`'s "Working in this repo" section loses
  "put a plan together and run with it rather than stopping to wait for a
  go-ahead" and "commit once a piece of work is in a reasonable state," replaced by a
  pointer to AGENT.md's Autonomy section; `todo-app/.claude/hooks/post-edit-autocommit.js`'s
  registration is left as-is (not restored).
- **Checks run:** all six.

## Checks

**1. Traceability — PASS**
HDR-0002's Decision section states exactly this edit and exactly this non-action
(leave `post-edit-autocommit.js` dead). The diff matches both: it edits only
`todo-app/CLAUDE.md`'s "Working in this repo" section per group 4's `recommendation`,
and no diff touches `post-edit-autocommit.js` or its registration.

**2. Evidence still holds — PASS**
Group 4's `why_it_matters` cites session `e6041b83` (agent cited CLAUDE.md to justify
running ahead, then had an unprompted commit rejected) and `91d6f2a4` (opposite
resolution of the same fork). Both ids resolve in `index.json`. Re-reading
`todo-app/CLAUDE.md` pre-diff confirms the two bullets HDR-0002 cites as removed
were actually present.

**3. Harness consistency — PASS**
Post-diff, `todo-app/CLAUDE.md`'s "Working in this repo" section no longer instructs
running ahead of a plan or auto-committing; `todo-app/AGENT.md`'s "Autonomy" section
(the other side of the `conflicts_with` pair) is unchanged and still says "write the
plan and stop there" / "do not commit changes automatically." The two files no longer
give opposite instructions on the same question.

**4. Tools & permissions — PASS**
No `tools:` line, `.claude/settings.json` permission, or hook matcher/scope changes
in this diff — this check has nothing to flag, correctly.

**5. Scope — PASS**
The diff touches only `todo-app/CLAUDE.md`. Group 2's other two recommendations
(restoring `pre-read-format-check.js`/`prompt-plan-reminder.js`, adding a `Stop`
hook) are untouched by this diff, matching HDR-0002's Decision item 3 ("unaffected by
this decision, proceed independently").

**6. HDR consistency — PASS**
HDR-0002's Decision, Context, and Rationale sections all cite groups 2 and 4 and
sessions `e6041b83`/`91d6f2a4` — the same finding and evidence this diff addresses.
No drift between what the HDR says was decided and what the diff actually does.

**UNKNOWN — whether this resolution affects autonomy language elsewhere**
HDR-0002 itself flags this as unresolved: whether removing CLAUDE.md's autonomy
bullets interacts with any other guidance in the repo that also touches
plan-vs-run-ahead behavior isn't checkable from `analysis.json`/`harness-snapshot.json`
alone — it would require a broader sweep of every guide file for autonomy-adjacent
language, which neither this dataset nor a text-diff check can establish. Reported as
`UNKNOWN`, not folded into check 3's `PASS`.

## Result

Checks 1-6 `PASS`, one explicit `UNKNOWN` (not a blocker — HDR-0002's own Validation
section already names this as a revalidation trigger, not something this pass needs
to resolve). **Ready for review.**
