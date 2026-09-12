# Exercise 4: Record why the harness changed
> tip: run /clear in your chat interface before starting the exercise to reset context.

## What you start with

The flow from Exercises 1-3 can now go from observed agent behavior to a concrete
harness change: analyze sessions, identify an improvement, prepare the change, and
open a pull request. That preserves **what** changed. It does not preserve **why** —
a future reviewer sees an instruction change, a skill gaining a tool, or an agent
losing a permission, with no record of which evidence drove the decision or why this
approach won over the alternatives.

## What is a Harness Decision Record?

A **Harness Decision Record (HDR)** — the harness equivalent of an Architecture
Decision Record — is a persistent record of a meaningful decision about an agent
harness (instructions, skills, agents, hooks, tools, permissions, knowledge, or
anything else shaping agent behavior). It should let someone later answer:

- What problem led to this decision?
- What did we decide, and why this approach over the alternatives?
- What behavior do we expect to change?

The value isn't the file itself — it's preserving reasoning that would otherwise
disappear into a session, a PR discussion, or a diff. Template:
`exercises/hdr-template.md`.

Not every change needs one. A typo fix or an obviously broken path repaired probably
doesn't. Granting a new tool, changing permissions, moving responsibility between
components, or turning a hook from advisory to blocking probably does. Too few HDRs
and the reasoning disappears; too many and the decision history becomes noise nobody
reads.

Concretely, using Exercise 3's own findings: the `tsconfig.json` include-path fix is
mechanical, checkable, and has exactly one reasonable outcome — no HDR needed, the PR
diff already says everything worth saying. The CLAUDE.md/AGENT.md autonomy
contradiction is different — once a human picks "AGENT.md wins on autonomy," that's a
real decision, with a real alternative that was seriously in play, and it traces back
to an actual incident (the human blocking an autonomous commit in session
`e6041b83`). *That's* the kind of change worth an HDR: it'll shape agent behavior
going forward, and six months from now nobody will remember why CLAUDE.md's
autonomy language disappeared unless something wrote it down.

## Task

Extend the continuous-improvement agent from Exercise 3 so it:

1. Decides whether a harness change warrants an HDR.
2. When it does, produces one using `exercises/hdr-template.md` — the agent writes
   it, not you.
3. Adds the HDR to the **same pull request** as the harness change.

## Why "summarize the diff afterward" doesn't work

A diff only shows what changed, not why. It might show an agent gained GitHub access
— not whether that was a deliberate requirement for opening PRs or something added
because it seemed convenient. The absence of production-code write access might be a
deliberate safety boundary, or something nobody thought about. An HDR writer
reconstructing reasoning after the fact turns plausible-sounding reasoning into
invented reasoning. Design the flow so the context needed to write the HDR honestly
is captured at decision time, not guessed at afterward.

## Design questions

Work through these with your agent, in plan mode, before it extends the flow:

1. **What context does the HDR writer need?** The analysis, the proposal, the actual
   change, supporting evidence, decisions made while preparing the change — which of
   these, and from where?
2. **When must reasoning be captured?** Some of it can't be reconstructed from the
   final diff — especially tool/permission decisions: why was a capability granted,
   withheld, or restricted?
3. **How do you prevent invented rationale?** Decide what happens when the template
   asks for reasoning that isn't actually present in the available context. A
   visibly incomplete record beats a convincing fictional one.
4. **When is an HDR warranted?** How does the flow distinguish mechanical
   maintenance from a decision worth preserving?
5. **How does the HDR connect to the change?** Where do HDRs live, how are they
   named, and how does a reviewer trace one back to the PR and harness change it
   describes?

## Success criteria

- The flow considers, for every change, whether it warrants an HDR — trivial
  mechanical changes (like the `tsconfig.json` fix) don't generate decision-record
  noise, and meaningful ones (like the autonomy policy call) do.
- Meaningful decisions produce an HDR using `exercises/hdr-template.md`, shipped in
  the same PR as the change.
- The HDR connects the change to the evidence and reasoning behind it — it captures
  the actual decision, not a plausible-sounding explanation of the diff written after
  the fact.
- Tool/permission choices are recorded as deliberate choices, explained rather than
  just listed.
- Missing reasoning is left visibly missing, never invented — it could have been
  written honestly from the context the agent actually had.
- A reviewer understands what changed and why without replaying the whole run, and it
  would still make sense six months from now.
