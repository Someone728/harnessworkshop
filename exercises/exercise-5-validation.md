# Exercise 5: Validate before the human decides

## What you start with

The continuous-improvement flow can now analyze past sessions, propose harness
improvements, prepare a concrete change, record the decision in an HDR, and open a
pull request containing both. That PR is your **Human-in-the-Loop**: a human inspects
it and decides whether to approve. But the reviewer shouldn't have to reconstruct the
entire improvement cycle just to judge whether the change looks safe and justified.
Before handing the PR over, the agent should validate as much as it reasonably can.

## What can you validate without running new agent sessions?

Proving a harness change actually improves future behavior would require running new
agent sessions against it — too slow and expensive to do for every small change, and
even a successful run wouldn't prove the harness is now correct in every situation. So
the goal isn't **prove the new harness will behave correctly**. It's **reduce
uncertainty enough for a human to make a good review decision**.

A lot of the chain is already checkable without new chats: does the change actually
address the finding that caused it? Do the proposal, the diff, and the HDR still
describe the same decision? Does the original session evidence actually support the
claimed root cause? Does the changed harness now contain contradictory instructions or
overlapping responsibility? Do new tools or permissions match the responsibility they
were introduced for? Does the change reach outside its intended scope? None of this
proves future behavior — but it does show the change is internally consistent,
traceable to a real problem, and free of obvious new risk.

## Task

Extend the continuous-improvement flow with a validation phase that runs **before the
pull request reaches a human reviewer**:

1. Don't start new agent chats to test the changed harness — validate using the
   artifacts and evidence the flow already produced.
2. Add the validation result to the PR: what was checked, what passed or failed, what
   evidence backs each check, and what remains uncertain.
3. The agent prepares evidence. It does **not** approve its own change — the PR stays
   the human-in-the-loop gate.

## Design questions

1. **What should be validated?** Which checks give useful confidence without turning
   every harness change into a full evaluation project? Consider traceability,
   original evidence, harness consistency, scope, tools, and permissions.
2. **What evidence backs each check?** A result shouldn't just say `PASS` — which
   artifact justifies it: `analysis.json`, supporting sessions, the proposal, the
   diff, the HDR, the final harness state?
3. **How much validation is enough?** Effort should scale with the change's impact
   and uncertainty — fixing an obviously broken path isn't the same as granting a new
   tool or turning a hook blocking.
4. **How should uncertainty be reported?** Some things can't be established without
   observing future behavior. Say so explicitly rather than turning missing evidence
   into a green checkmark.
5. **What does the reviewer need in the PR?** A compact summary that lets a human
   decide without replaying the whole improvement cycle themselves.
6. **What happens when validation finds a problem?** It should check conformance to
   the decision already made, not start a new open-ended improvement cycle. Decide
   what the agent may fix within the existing decision, what needs a new human
   decision, and when it should leave the PR in draft instead. A new "even better"
   idea isn't automatically a validation failure — it belongs in a future cycle.

## Success criteria

- A harness change is validated before it's presented for human approval.
- Validation is based on evidence, not generic claims like "looks good".
- The agent checks that finding, proposal, change, and HDR remain consistent.
- Relevant tool and permission boundaries are checked.
- The validation clearly states what could **not** be established.
- Validation effort is proportional to the change, not identical for every PR.
- The validation summary is added to the pull request.
- Problems within the existing decision may be corrected, but validation doesn't
  expand the scope of the change.
- If resolving a problem requires a new design decision, the agent stops and leaves
  that to the human reviewer.
- Validation can stop even when further improvements are still imaginable.
- The agent stops at **ready for human review** — it never approves or merges its own
  change.

## Self-check

- Would a reviewer understand why each check passed or failed?
- Did the agent validate the actual change, rather than merely restating the HDR?
- Are important uncertainties visible?
- Is the validation lightweight enough that people would actually keep using this
  loop?
- Can a human make a reasonable approval decision from the PR without reconstructing
  the whole analysis themselves?
- Could validation stop even if the agent can still imagine further improvements?
