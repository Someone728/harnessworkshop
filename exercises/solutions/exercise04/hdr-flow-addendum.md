# Solution reference: HDR flow (Exercise 4)

This is a reference implementation of the extension Exercise 4 asks you to design.
It's not a new skill or agent — it's additions to the live `implement-harness-fix`
skill and `harness-fix-implementer` agent from Exercise 3, in `.claude/skills/` and
`.claude/agents/` at the repo root. Compare against your own extension; differences
in wording are fine, differences in *whether an HDR ever gets invented content* or
*whether mechanical noise generates HDRs* are the thing to check.

The two new sections added to `.claude/skills/implement-harness-fix/SKILL.md`
("Deciding whether a change needs a Harness Decision Record", "Writing the HDR",
"Resolving a previously flagged conflict or policy decision") and the one paragraph
added to `.claude/agents/harness-fix-implementer.md` are reproduced in full at the
bottom of this file. Read them there first if you want the mechanics before the
reasoning below.

## Why two trigger points, not one

Exercise 3's flow already has two moments where a real harness decision gets made,
and they don't happen in the same session:

1. **At mechanical-implementation time.** Most mechanical actions are exactly what
   they sound like — the tsconfig fix has no alternative worth recording. But some
   mechanical actions are decisions wearing a mechanical classification: adding a
   brand-new `Stop` hook that runs `npm run build` is a concrete, checkable edit
   (mechanical, in Step 2's sense) *and* a new enforcement mechanism with real
   alternatives (block at `Stop`? at every `PostToolUse`? advisory-only?) that will
   shape every future session in this repo. Step 2's classification answers "is this
   safe to implement," not "does this need a decision record" — those are different
   questions, which is why the HDR check runs as its own pass after Step 3, not as a
   `fix_type` value.
2. **When a flagged conflict/policy_decision actually gets resolved.** This is the
   exercise's own flagship example: two guide files disagree on autonomy, `finding
   #3` gets flagged with two fully-specified options and tradeoffs, and nothing
   happens until a human picks one — in a *different, later* session from the one
   that produced the flag. If the HDR write only happened inside Step 3, this
   decision would never get recorded at all, because Step 3 never implements a
   `policy_decision`. The "Resolving a previously flagged conflict" section exists
   specifically to catch this.

## Answering the exercise's design questions

**1. What context does the HDR writer need?** Exactly four sources, no more:
the specific `analysis.json` finding, the actual diff, the previously-recorded draft
PR body (when resolving a conflict — the options/tradeoffs were already captured at
flag time by Step 3's own draft-PR requirement, so there's no need to reconstruct
them), and anything the human explicitly says in the resolving session. Nothing about
the agent's own internal deliberation is a valid source — if a plausible-sounding
justification isn't traceable to one of those four, it doesn't go in the HDR.

**2. When must reasoning be captured?** Two moments, matching the two trigger points
above — and notably, *not* at "whenever we get around to writing the HDR." The tool/
permission reasoning for `harness-fix-implementer` itself (see `HDR-0001` below) was
capturable only while that agent was being designed in Exercise 3, because that's the
only point where the alternative (a project-wide `permissions.deny`) was actually
being weighed against the hook-based approach. By the time Exercise 4 runs, that
reasoning either already exists in the agent/skill's own prose (it does — Exercise 3's
files state it directly) or it's gone. This addendum's HDR-0001 is assembled *from
that already-written prose*, not reconstructed from the diff.

**3. How do you prevent invented rationale?** The sourcing rule is a hard allow-list,
not a suggestion: `Context`/`Evidence`/`Rationale` may only restate what's in
`analysis.json`, the diff, a prior draft PR body, or an explicit human statement.
Anything else becomes `_Not recorded: [what's missing]_`. `HDR-0002` below
demonstrates this directly — the simulated human resolving the autonomy conflict adds
no reasoning beyond picking an option, so the Rationale section says exactly that
instead of manufacturing a justification for why option A "obviously" made sense.

**4. When is an HDR warranted?** The checklist in "Deciding whether a change needs a
Harness Decision Record" (capability grant/removal, enforcement-mechanism change,
`conflicts_with` resolution, responsibility shift) vs. not (single-answer fixes,
restoring already-specified-but-dead behavior, verbatim assembly). Applied to the
current `exercises/solutions/exercise02/analysis.json`: the tsconfig fix (group 1)
gets no HDR — one checkable correct value, no alternative. Restoring
`pre-read-format-check.js`/`prompt-plan-reminder.js` to the behavior
`.claude/settings.json` already implies they should have (part of group 2) gets no
HDR either. Adding the *new* `Stop` hook that runs `npm run build` (also part of
group 2's recommendation) does — a gate that didn't exist before, with real
alternatives for where/how strictly to enforce it. And resolving groups 2 and 4's
mutual `conflicts_with` (restore `post-edit-autocommit.js` vs. make AGENT.md's
autonomy language canonical) always does — that's what `conflicts_with` means.

**5. How does the HDR connect to the change?** Same branch, same commit series, same
PR — never a follow-up. Storage location isn't actually a free design choice here:
`harness-fix-write-guard.js` only allows this agent to write under `todo-app/`, so
`todo-app/docs/decisions/HDR-<NNNN>-<slug>.md` is where it has to live regardless.
Numbering is sequential by scanning that directory. The PR body gets a line pointing
at the HDR path; the HDR's own `Context`/`Decision` text names the `analysis.json`
finding id(s), so tracing works in both directions without replaying the run.

## Worked examples

- [`HDR-0001-harness-fix-implementer-scope-via-hook.md`](HDR-0001-harness-fix-implementer-scope-via-hook.md)
  — the tool/permission decision behind Exercise 3's own restricted agent, assembled
  from the reasoning already written into `.claude/agents/harness-fix-implementer.md`
  and `exercise-3-implement-harness-fix.md`. No conflict, no human resolution needed
  — this is the "captured at design time" case.
- [`HDR-0002-agent-md-wins-on-autonomy.md`](HDR-0002-agent-md-wins-on-autonomy.md) —
  resolving the `conflicts_with` link between
  `exercises/solutions/exercise02/analysis.json` groups 2 (restore
  `post-edit-autocommit.js`) and 4 (make AGENT.md's autonomy language canonical) by
  choosing group 4's side and leaving `post-edit-autocommit.js` dead, sourced
  entirely from those two groups' own text (the draft-PR options a real run of Step 3
  would have produced, reconstructed here since no PR was actually opened against
  this reference dataset). This is the "resolving a previously flagged conflict"
  case, and deliberately shows a human decision with no added rationale beyond
  picking a side.

Both are worked examples of what `todo-app/docs/decisions/HDR-000X-*.md` would
contain if this flow ran for real — `todo-app/` itself is left untouched here, the
same way `exercises/solutions/exercise03/applied-changes.json` records a worked diff
without actually mutating `todo-app/tsconfig.json`. The pristine-flawed app is still
the shared baseline later exercises depend on.

## The two new SKILL.md sections and the agent addition, verbatim

### `.claude/skills/implement-harness-fix/SKILL.md`

```markdown
## Deciding whether a change needs a Harness Decision Record

Run this after every mechanical action in Step 3 actually lands, and again whenever a
previously flagged conflict/policy_decision gets resolved (see below). Most
mechanical actions won't need one — this is not a second classification pass on top
of Step 2, it's a much narrower question: *did this change something that shapes
future agent behavior and had a real alternative, or was it a fix with exactly one
correct answer?*

**Warranted** — the change does at least one of:
- Grants, removes, or narrows a tool, permission, or capability for an agent or hook.
- Changes an enforcement mechanism's strength or scope: a new gate where none existed
  (e.g. adding a `Stop` hook), advisory<->blocking, or widening/narrowing what a hook
  checks.
- Resolves a `conflicts_with` pair. This always qualifies — a finding only carries
  `conflicts_with` because a real alternative was seriously in play, which is the
  definition of a decision rather than a fix.
- Moves responsibility for a behavior between agent, hook, skill, or human.

**Not warranted** — the change:
- Has exactly one checkable correct value with no live-behavior alternative (a path,
  a typo, a broken reference).
- Restores a registration to the behavior `harness-snapshot.json`/`analysis.json`
  already say it was *supposed* to have — bringing dead-but-uncontested code back to
  life isn't a new decision.
- Assembles content that already exists verbatim elsewhere (e.g. a missing index file
  built from names/summaries `harness-snapshot.json` already has).

If a single finding's recommendation bundles both (e.g. "restore hook A and B, add
new Stop hook C" — A/B restorative, C new), only the qualifying slice gets an HDR;
don't write one for the whole finding just because part of it qualifies, and don't
skip the one that does because the rest doesn't.

### Sourcing — never invent

An HDR may only draw on:
- The specific `analysis.json` finding/group (`harness_component`, `why_it_matters`,
  `recommendation`, `evidence_session_ids`, `confidence`, `conflicts_with`).
- The actual diff being committed.
- When resolving a conflict: the draft PR body that already recorded the
  options/tradeoffs at flag time — reuse that text, don't regenerate it from memory.
- Explicit statements the human makes in the current session directing the decision.

If a template field has no backing source from the list above, write
`_Not recorded: [what's missing and why]_` in that field instead of a plausible-sounding
guess — a visibly incomplete HDR is correct output, not a failure. This applies to
`Context`, `Evidence`, and `Rationale` specifically, since those are claims about what
already happened or was already considered. `Expected effect` and `Validation` are
different: they're a forward-looking plan the implementer is entitled to author now
(the same way any new ADR proposes a hypothesis and a way to check it) — write a real
one, don't leave those blank as if they too required prior evidence.

## Writing the HDR

When the checklist above says yes:
1. Copy the structure of `exercises/hdr-template.md` exactly — same headers, same
   order.
2. Number it by scanning `todo-app/docs/decisions/HDR-*.md` for the highest existing
   number and incrementing (start at `0001` if none exist). File:
   `todo-app/docs/decisions/HDR-<NNNN>-<slug>.md`.
3. `Status: accepted`. Leave the `Result` section exactly as the template's own
   uncompleted placeholder — filling it in belongs to a later validation pass, not
   this run.
4. Have `harness-fix-implementer` write the HDR file in the *same* branch/commit
   series as the harness change it documents — never a separate branch or a
   follow-up PR.
5. Add one line to the PR body pointing at the HDR's path, and have the HDR's own
   `Context`/`Decision` text name the `analysis.json` finding id(s) it resolves, so a
   reviewer can trace either direction without replaying the session.

## Resolving a previously flagged conflict or policy decision

This is the second entry point into this skill, used in a later session once a human
has actually made the call on something Step 3 flagged (a draft PR's options, or a
reported `policy_decision`). Only run this when the human explicitly names which
draft PR/branch (or reported finding) they're resolving and which option they've
chosen — never infer this from silence, and never re-run it speculatively against an
already-flagged finding on your own initiative.

1. Re-read the original `analysis.json` finding(s) and the existing draft PR body (or
   the reported flag text, if no PR was opened) to recover the options and tradeoffs
   already recorded there — this is the evidence base, not something to redo.
2. Delegate to `harness-fix-implementer`: make the actual edit(s) implementing the
   chosen option, on the *same branch* the draft PR already used (turning it from a
   no-diff draft into a real change) — or a new branch off the same naming
   convention if the finding was only reported, never drafted.
3. Run the "Deciding whether a change needs a Harness Decision Record" check above —
   a `conflicts_with` resolution always qualifies. Write the HDR per "Writing the
   HDR" above, sourcing `Rationale` from the recorded options/tradeoffs plus whatever
   the human actually said when choosing. If the human gave no reasoning beyond
   picking an option, the HDR says exactly that — don't supply a reason on their
   behalf.
4. Mark the PR ready for review (or open it, if it was only a reported flag) with a
   body stating the decision made and linking the HDR.
```

### `.claude/agents/harness-fix-implementer.md`

```markdown
- When the skill tells you a change warrants a Harness Decision Record, writing
  `todo-app/docs/decisions/HDR-*.md` is part of your job, same writable surface as
  everything else under `todo-app/`. The same non-guessing rule applies to every
  field in it: `Context`, `Evidence`, and `Rationale` may only say what
  `analysis.json`, the diff, a prior draft PR body, or something the human actually
  said in this session support — if a field isn't backed by one of those, write that
  the reasoning wasn't recorded rather than composing something plausible. Commit the
  HDR on the same branch as the change it documents, never separately.
```
