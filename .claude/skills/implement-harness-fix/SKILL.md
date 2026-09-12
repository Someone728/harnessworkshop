---
name: implement-harness-fix
description: Classifies docs/log-schema/analysis.json findings as mechanical, policy_decision, or needs_investigation, then implements the mechanical ones for real (diff, commit, PR) via the harness-fix-implementer subagent — flagging only the specific parts that genuinely need a human, not whole findings by default. Use when asked to act on, implement, or fix harness-analysis findings.
---

# Implement Harness Fix

`analysis.json` (from the `analyze-groups` skill) names *what's wrong* and *what to
do about it*, but not every finding is safe to act on the same way. This skill sorts
that out and then runs the `harness-fix-implementer` subagent to do the safe part for
real — never the main session, and never anything under `todo-app/src/**` (a
`PreToolUse` hook enforces that independently of this skill). Everything else under
`todo-app/` is writable: the goal is to keep a human out of the loop wherever a
finding's own text makes the safe/unsafe boundary explicit, and only pull one in for
the part that's genuinely a judgment call — not for a whole finding just because part
of it is contested.

## What to read

- `docs/log-schema/analysis.json` — the findings to act on.
- `docs/log-schema/harness-snapshot.json` — current confirmed state of harness
  components, to sanity-check a finding's claim before implementing it.
- `docs/log-schema/index.json` — per-session facts, to verify `evidence_session_ids`
  actually resolve to real sessions.
- `exercises/hdr-template.md` — the template for any Harness Decision Record this run
  produces.
- `todo-app/docs/decisions/` — existing HDRs, if any, to number a new one correctly.

## Step 0: refuse stale input

Compare `analysis.json.generated_at` against `harness-snapshot.json` and
`index.json`'s own generation timestamps. If `analysis.json` predates either, **stop
the entire run** and report which file is stale — the findings may describe a
harness state that's no longer current. Do not implement, flag, or open anything.

## Step 1: verify evidence, per finding

For each finding, check that every id in `evidence_session_ids` exists in
`index.json`. If any don't resolve, classify that finding as **needs_investigation**
("evidence unverifiable — session id(s) not found in index.json") and skip
classification below for it.

## Step 2: classify every remaining finding

Read the full `recommendation` text for what it actually asks for — most
recommendations bundle more than one concrete action. Classify at the level of each
action, not just the finding as a whole:

1. **mechanical action** — a concrete, literal change (add/remove/edit this text, in
   this file, to say this) inside `todo-app/**` (anything except `todo-app/src/**`),
   that can be checked against the file's current content, and that nothing else in
   the same recommendation says to withhold. Implement it — do not let one contested
   action in a recommendation block the rest of it.
2. **contested action (conflict)** — a specific action that either the recommendation
   itself flags as conditional on another finding ("do not do X without also
   resolving finding N"), or that directly implements the side of a `conflicts_with`
   link. Only the named action is contested, not the whole recommendation unless the
   entire recommendation *is* that one action (e.g. the recommendation has no
   internal structure to split — it's a single either/or, like "make document A or
   document B canonical"). Never implement a contested action; route it into the
   draft-PR conflict writeup (Step 3).
3. **policy_decision** — the recommendation (or, per #2, an un-splittable whole
   finding) requires picking between multiple valid options and `analysis.json`
   doesn't settle which one wins.
4. **needs_investigation** — the fix depends on something not observable from
   `analysis.json`/session data (e.g. which shell/OS the team actually uses).

A finding commonly produces a mix: most of its recommendation is mechanical, one
specific action inside it is contested. Treat these independently — implement the
mechanical part for real, flag only the contested sliver.

State the classification and one-sentence reasoning for every finding (and every
split-out action within it) before acting — this is the artifact that makes
"deliberately not touched" auditable, not silently skipped.

## Step 3: act, delegating all writes to `harness-fix-implementer`

Do not edit or commit anything from the main session — hand every action below to the
`harness-fix-implementer` subagent, one finding (or one mechanical slice of a finding)
at a time, so the write/bash guard hooks are the ones enforcing scope, not this
skill's own judgment.

- **mechanical** (a whole finding, or the non-contested slice of one): instruct the
  subagent to create branch `harness-fix/finding-<id>-<slug>`, make exactly the
  recommended edit(s), commit with a message citing the finding id/title, and
  `gh pr create --draft` with a body quoting `harness_component`, `why_it_matters`,
  `recommendation`, and `confidence` from `analysis.json` (and, if part of this
  finding's recommendation was withheld as contested, naming that remainder and
  pointing at the conflict PR below in the same body). It stays a draft until
  "Validating before requesting human review" below decides whether to mark it
  ready. If `gh`/a remote isn't available, the subagent stops after the local commit
  and the skill reports the branch name plus a written PR description as the
  substitute.
- **contested action(s) / un-splittable policy conflicts**: group every contested
  action or whole-finding conflict that references the same `conflicts_with` pair
  into one **draft** PR — no code diff — whose body lists the options/tradeoffs for
  each side and states plainly it needs a human decision. If more than one finding
  touches the same conflict, one draft PR covering all of them is better than several
  overlapping ones. Without `gh`/a remote, report this as a flagged entry instead (no
  branch needed — there's no diff to hold).
- **policy_decision** (no conflict link, just inherently ambiguous) and
  **needs_investigation**: no subagent call, no branch, no PR. Report the finding id,
  category, and the concrete next step or exact tradeoff a human needs to weigh.

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
  (e.g. adding a `Stop` hook), advisory↔blocking, or widening/narrowing what a hook
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
4. Open the PR as `--draft` (or update the existing draft in place if one already
   exists) with a body stating the decision made and linking the HDR. Same as the
   mechanical path: "Validating before requesting human review" below decides
   whether it advances to ready — this step never marks it ready directly.

## Validating before requesting human review

Run this after Step 3's edit/commit lands (and after the HDR check, when one
applies), and before any PR — mechanical or conflict-resolution — is marked ready
for review. Never start a new agent session to test the changed harness; every check
below is answerable from artifacts the flow already produced:
`analysis.json`, the actual diff, `harness-snapshot.json`, `index.json`, and the HDR
when one exists.

### Checks

1. **Traceability** — does the diff match the finding's `recommendation`, and touch
   only the file(s) `harness_component` names? Quote the specific clause of
   `recommendation` the diff implements.
2. **Evidence still holds** — for each `evidence_session_ids` entry the finding
   relies on, does it still resolve in `index.json`, and is the *specific* fact
   `why_it_matters` claims still true against current on-disk state — not just "the
   session exists," but "the thing it claims is still the case."
3. **Harness consistency** — re-read the edited file(s), and, when the finding names
   another file as the other side of a contradiction (a `conflicts_with` pair or an
   explicitly named "vs." file), re-read that one too. Confirm the contradiction is
   actually gone, not restated in different words.
4. **Tools & permissions** — only when the diff touches an agent's `tools:` line,
   `.claude/settings.json` permissions, or a hook's matcher/scope: does each
   capability granted or removed match the responsibility the finding names, and
   nothing broader?
5. **Scope** — does the diff stay inside `todo-app/` outside `src/**` (already
   hook-enforced, but confirm it held) and inside the specific file(s) the finding
   names — no incidental edits elsewhere?
6. **HDR consistency** (only when an HDR was written) — does the HDR's `Decision`
   text match the actual diff, and do its `Context`/`Rationale` cite the same
   finding/evidence this diff addresses?

### Scaling effort

Reuse the HDR-warranted signal from above instead of inventing a second scoring
system:
- **No HDR was warranted** (plain mechanical fix): run checks 1, 2, and 5 only —
  there's nothing for 3/4/6 to check against.
- **An HDR was warranted** (capability change, enforcement change, conflict
  resolution): run all six checks, and for check 3 also re-read every file the HDR's
  `Context` section names, not just the edited file.

### Reporting — never a bare PASS

For every check run, record: status (`PASS` / `FAIL` / `UNKNOWN`), the specific
artifact that justifies it (cite or quote it, don't just name the file), and one line
of reasoning. `UNKNOWN` is a legitimate, expected result — use it whenever a check
would require observing future behavior or information outside the artifacts listed
above, and say exactly what's missing. Never turn an unanswerable check into a
`PASS`.

### When a check fails

- **Fixable within the existing decision** (the diff missed part of the
  recommendation, touched an unrelated line, or the HDR text drifted from the actual
  diff): fix it directly on the same branch, then re-run the check.
- **Reveals something the original decision didn't cover** (the fix doesn't actually
  resolve the finding, or a new contradiction/capability question surfaces that
  nothing upstream decided): do not fix it and do not guess. Leave the PR in
  `draft`, add a comment naming exactly what new decision is needed and why
  validation can't resolve it on its own, and stop — that's a new decision for a
  human, not something this pass can patch around.
- **A better idea occurs to you** (an improvement beyond what the finding actually
  asked for): note it, don't act on it, and don't block the PR on it — that belongs
  in a future analysis cycle, not this validation pass.

### Finishing

If every check is `PASS` or `UNKNOWN` (with the uncertainty stated) and nothing
surfaced a new decision, add a `## Validation` section to the PR body — one line per
check run: status, artifact cited, reasoning — and mark the PR ready
(`gh pr ready`). `gh pr ready` means "ready for a human to look at," not "approved" —
the agent's job ends here; it never approves or merges its own change.

## Step 4: final summary

Report every finding id, what was implemented vs. flagged (down to the sub-action
level where a finding was split), its outcome (PR/branch link, or the flagged
reason), its HDR outcome (`HDR written: <path>` or `No HDR needed: <one-line why>`),
and its validation outcome (`Ready for review` or `Left in draft: <what's blocking
it>`) in one list — this is what makes "nothing was silently fixed, silently
over-flagged, or silently waved through" checkable at a glance.

## Verifying the write-restriction actually holds

Don't trust the hook by reading it — try to break it. After running this skill once,
separately instruct `harness-fix-implementer` to edit a file under
`todo-app/src/**` and confirm `harness-fix-write-guard.js` blocks it with exit code 2,
not that the subagent simply declined. Writes to `todo-app/tsconfig.json` or
`todo-app/package.json` should now succeed — only `todo-app/src/**` is denied.
