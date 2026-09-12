# Validation: group 2's Stop-hook addition — left in draft

Worked example of a validation pass that finds something the original decision
didn't cover, and stops instead of guessing. Full path (an HDR was warranted for the
new `Stop` hook — see below), so all six checks run.

- **Finding:** group 2, "Disabled hooks and no Stop hook let a fixed regression ship
  again with zero verification." `recommendation`: add a `Stop` hook entry that runs
  `npm run build`; restore `pre-read-format-check.js` and `prompt-plan-reminder.js`;
  do not restore `post-edit-autocommit.js` without resolving group 4 (handled
  separately — see `HDR-0002-agent-md-wins-on-autonomy.md`).
- **HDR:** written for the new `Stop` hook specifically (a new enforcement mechanism
  — restoring the other two hooks to their own already-specified behavior did not
  get one, per the HDR-warranted checklist).
- **Diff validated:** `todo-app/.claude/settings.json` gains a `Stop` hook entry
  running `npm run build`; the commented-out logic in `pre-read-format-check.js` and
  `prompt-plan-reminder.js` is restored.
- **Checks run:** all six.

## Checks

**1. Traceability — PASS**
The diff adds exactly the `Stop` hook `recommendation` describes and restores
exactly the two named hooks. No `post-edit-autocommit.js` change, matching group 2's
own "do not restore ... without also resolving group 4."

**2. Evidence still holds — PASS**
`why_it_matters` cites session `2b95c47e`'s confirmed "0 active lines" for all three
hooks and no registered `Stop` hook. Re-reading `todo-app/.claude/hooks/pre-read-format-check.js`
and `prompt-plan-reminder.js` pre-diff confirms both were still fully commented out,
and `todo-app/.claude/settings.json` still had no `Stop` entry.

**3. Harness consistency — PASS**
Post-diff, `.claude/settings.json` registers a `Stop` hook and the two restored hooks
have active logic again — the state `why_it_matters` says should exist now does.

**4. Tools & permissions — FAIL (new decision needed)**
The new `Stop` hook, as specified by `recommendation` ("add a `Stop` hook entry that
runs `npm run build`... and surfaces failures before the agent's final response is
sent"), fires unconditionally at the end of every turn in every session working in
this project — not scoped to turns that touched `todo-app/src/**`, and not scoped to
any particular agent. `recommendation` never states whether that's intentional: it
only says the check should exist, not how broadly it should fire. Running a full
`npm run build` after every turn — including turns that only read files or answered a
question with no edit at all — is a real operational cost the original finding didn't
weigh, and scoping it (e.g. only run when a `todo-app/src/**` file changed this turn)
is a design choice, not a mechanical detail implied by the recommendation's wording.

**5. Scope — PASS**
The diff touches only `todo-app/.claude/settings.json` and the two named hook files,
all inside `todo-app/` and outside `src/**`.

**6. HDR consistency — PASS**
The HDR written for the `Stop`-hook addition describes it as "a Stop hook running
`npm run build` and surfacing failures," matching the diff. (Its own Validation
section does not yet address the firing-scope question raised by check 4 above —
consistent with the HDR, not contradicting it, since that question wasn't part of the
decision it recorded.)

## Result

Check 4 surfaces a question the original finding and its HDR never settled: should
this `Stop` hook run unconditionally, or only on turns that touched
`todo-app/src/**`? Neither answer is implied by `recommendation`'s text, and picking
one now would be validation quietly making a design decision instead of checking one
that was already made.

**Left in draft.** PR comment added: "Validation found the new `Stop` hook fires on
every turn, including turns with no code changes — `recommendation` doesn't specify
whether that's intended. Needs a human decision: run unconditionally as specified, or
scope it to turns that touched `todo-app/src/**`. Restoring the other two hooks
(checks 1, 2, 3, 5, 6 all `PASS`) is not blocked by this and could ship separately if
preferred." No fix was attempted — this is a new decision, not a defect in executing
the one already made.
