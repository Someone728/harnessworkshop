# Solution reference: validation flow (Exercise 5)

This is a reference implementation of the extension Exercise 5 asks you to design.
Like Exercise 4, it's not a new skill — it's additions to the same live
`implement-harness-fix` skill and `harness-fix-implementer` agent
(`.claude/skills/`, `.claude/agents/` at the repo root), which by now has run through
Exercises 3 and 4: classify → implement/flag → decide-and-write-an-HDR → (this
exercise) validate → mark ready. Compare against your own extension; differences in
wording are fine, differences in *whether validation ever approves its own change* or
*whether uncertainty gets reported as a false PASS* are the thing to check.

The new "## Validating before requesting human review" section, the two small
gating changes in Step 3 and the conflict-resolution section, the extended Step 4,
and the added agent paragraph are reproduced in full at the bottom of this file.

## Why draft-then-validate, not validate-then-open

Step 3 (Exercise 3) used to call `gh pr create` directly for mechanical actions and
mark conflict PRs `--draft` only because they had no diff yet. Exercise 5 changes
*both* paths to open as `--draft` unconditionally and adds one gate in between:
nothing reaches `ready` without passing through "Validating before requesting human
review" first. This is a small, mechanical change to Step 3/the conflict section, not
a redesign — the validation logic itself lives entirely in the new section, which is
also the only place that calls `gh pr ready`.

## Answering the exercise's design questions

**1. What should be validated?** Six checks, each mapped to a concrete thing this
harness's schema already tracks: does the diff match `recommendation` and touch only
`harness_component`'s file(s) (traceability); does `why_it_matters`'s specific claim
still hold, not just "the session exists" (evidence); does the finding's other side of
a contradiction actually get resolved, not restated (harness consistency); does a
tool/permission change match the responsibility the finding named (tools &
permissions); does the diff stay inside the named file(s) and outside `src/**`
(scope); does the HDR's own text match the diff it documents (HDR consistency). This
list isn't generic software-review advice — every check is answerable from a field
this specific `analysis.json`/HDR schema already has.

**2. What evidence backs each check?** The reporting rule is explicit: status plus
"the specific artifact that justifies it," never a bare `PASS`. This mirrors Exercise
4's HDR sourcing rule almost exactly (never state something without pointing at
what backs it) — the same discipline, applied to verification instead of
justification.

**3. How much validation is enough?** Effort scales off a signal that already
exists — the HDR-warranted checklist from Exercise 4 — instead of a second, invented
severity scale. A plain mechanical fix (no HDR) only needs traceability, evidence,
and scope checked; a capability change or conflict resolution (HDR warranted) gets
all six, plus a deeper reread of every file the HDR's own `Context` names. One
signal, reused for two purposes, so proportionality doesn't need its own ruleset.

**4. How should uncertainty be reported?** `UNKNOWN` is a first-class status, not an
error state — used whenever a check would need information outside the five listed
artifacts (most often: anything about *future* behavior). `VALIDATION-hdr-0002-autonomy.md`
below shows this directly: whether removing CLAUDE.md's autonomy bullets affects
guidance elsewhere that also touches autonomy isn't answerable from this dataset, so
it's reported as `UNKNOWN`, not waved through as a `PASS`.

**5. What does the reviewer need?** A `## Validation` section in the PR body itself
(not a separate comment a reviewer might miss) — one line per check, and a closing
line stating either "ready" or exactly what's still blocking it. A human should be
able to read the PR once and know what was actually checked, not just that "validation
ran."

**6. What happens when validation finds a problem?** Three outcomes, matching the
exercise's own boundary between "correcting execution of a decision" and "making a
new one": fix in place when the problem is within the decision already made (Step 3's
diff missed something, or the HDR drifted from it); leave the PR in `draft` with a
named blocker when the problem reveals something nobody decided yet; and — this one
is easy to skip — explicitly *not* act on a new, better idea that occurs mid-validation,
since that's scope creep dressed as thoroughness. `VALIDATION-group-2-stop-hook-flagged.md`
below is the worked example for the "leave it in draft" branch specifically, so it's
demonstrated rather than only described.

## Worked examples

- [`VALIDATION-finding-1-tsconfig.md`](VALIDATION-finding-1-tsconfig.md) — the light
  path: no HDR was warranted for the tsconfig fix, so only checks 1/2/5 run, all
  `PASS`, PR goes straight to ready.
- [`VALIDATION-hdr-0002-autonomy.md`](VALIDATION-hdr-0002-autonomy.md) — the full
  path: validates Exercise 4's `HDR-0002` and the diff it documents against all six
  checks, including one deliberate `UNKNOWN`.
- [`VALIDATION-group-2-stop-hook-flagged.md`](VALIDATION-group-2-stop-hook-flagged.md)
  — a full-path validation that surfaces something the original decision didn't
  cover, and stops: the PR stays in `draft` with a named blocker instead of being
  silently fixed or waved through.

All three are worked examples of what a PR's `## Validation` section would contain —
`todo-app/` itself stays untouched here, the same convention Exercises 3 and 4's
worked examples already follow.

## The SKILL.md/agent changes, verbatim

### Step 3's mechanical-action bullet (gating change only)

```markdown
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
```

### "Resolving a previously flagged conflict or policy decision" step 4 (gating change only)

```markdown
4. Open the PR as `--draft` (or update the existing draft in place if one already
   exists) with a body stating the decision made and linking the HDR. Same as the
   mechanical path: "Validating before requesting human review" below decides
   whether it advances to ready — this step never marks it ready directly.
```

### New section: "Validating before requesting human review"

```markdown
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
```

### Step 4 (extended)

```markdown
## Step 4: final summary

Report every finding id, what was implemented vs. flagged (down to the sub-action
level where a finding was split), its outcome (PR/branch link, or the flagged
reason), its HDR outcome (`HDR written: <path>` or `No HDR needed: <one-line why>`),
and its validation outcome (`Ready for review` or `Left in draft: <what's blocking
it>`) in one list — this is what makes "nothing was silently fixed, silently
over-flagged, or silently waved through" checkable at a glance.
```

### `.claude/agents/harness-fix-implementer.md` (new paragraph)

```markdown
- Validating your own change before it's marked ready for review is also your job.
  You may fix a problem that's a correction within the decision already made (your
  diff missed part of the recommendation, drifted from the HDR, or touched something
  unrelated) — fix it and re-check. You may not resolve a problem that would require
  a new decision nobody's made yet; leave the PR in `draft` and say exactly what's
  missing instead of picking an answer. `gh pr ready` means the PR is ready for a
  human to look at — it is never you approving your own change.
```
