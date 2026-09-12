# Exercise 3: Implement a harness fix — with an agent that can't touch your source code
> tip: run /clear in your chat interface before starting the exercise to reset context.

> **Fast track note:** if you got here via the Fast track prompt, the reference
> `analyze-groups` skill actually ran against `harness-logs/`, so your `analysis.json`
> likely has *several* findings, not just one. For speed, you don't need to run the
> full classify → implement → commit → PR flow against all of them — one is enough to
> see the mechanics work. Say this explicitly to your agent, don't leave it to infer:
>
> ```
> analysis.json probably has multiple findings. For now, only act on one of
> them — pick one classified as safe to implement directly (e.g. "mechanical"),
> and run the full flow (classify, implement, commit, open PR) against just
> that finding. Leave the rest of analysis.json untouched.
> ```

From Exercise 2 you have `analysis.json`: fully-reasoned findings, each with a
harness component, why it matters, a recommendation, and a confidence level. Nothing
has actually changed in the harness yet — that's this exercise.

## Prerequisites

Actually opening a PR needs a git remote you can push to, with `gh` authenticated
against it. If you don't have that set up (or don't want to push from a workshop
sandbox), that's fine — a local branch with a real commit and a written PR
description is an acceptable substitute for every success criterion below except the
literal "PR opened" part. Don't let missing GitHub access block the actual exercise.

## Quick primer: subagents and scoped enforcement

Two mechanics this exercise needs, if you haven't used them elsewhere in the
workshop yet — and one wrong instinct worth naming up front.

**A subagent** is a Claude Code agent scoped to a specific job, defined as a markdown
file with frontmatter, e.g. `.claude/agents/example.md`:

```
---
name: example
description: One-line description of when to use this agent.
tools: Read, Edit, Bash
model: sonnet
---

System-prompt-style instructions for what this agent does and how.
```

The `tools:` line restricts which tools this agent has *at all* — an on/off switch
per tool, not a per-path restriction. It won't stop this agent from editing
`todo-app/src/**` if `Edit` is in its list.

**The wrong instinct: a project-level permission deny rule.** You might reach for a
`.claude/settings.json` entry like `"deny": ["Edit(todo-app/src/**)"]`. Don't — that
applies to *every* session and *every* agent in the repo, including your main session
doing Exercises 1-2 and any everyday work in `todo-app/src/`. It doesn't restrict one
agent; it breaks source editing for everyone.

**What actually scopes to one agent: a `PreToolUse` hook that checks who's calling.**
When a tool call comes from inside a subagent, the hook's input includes an
`agent_type` field naming that subagent (absent when the main session calls the tool
directly). A hook can use that to block only this one agent, on only this one path:

```js
// .claude/hooks/harness-fix-scope-guard.js — PreToolUse, matcher: "Edit|Write"
let input = "";
process.stdin.on("data", (chunk) => (input += chunk));
process.stdin.on("end", () => {
  const payload = JSON.parse(input || "{}");
  const isTargetAgent = payload.agent_type === "harness-fix-implementer";
  const touchesSrc = /todo-app\/src\//.test(payload.tool_input?.file_path ?? "");
  if (isTargetAgent && touchesSrc) {
    process.stderr.write("harness-fix-implementer may not write to todo-app/src/**\n");
    process.exit(2); // non-zero from a PreToolUse hook blocks the tool call
  }
  process.exit(0);
});
```

Registered project-wide in `.claude/settings.json` like any other hook, but its
*effect* only fires for the one `agent_type` it checks for — your main session and
every other agent stay unaffected. You'll design your own version of this below —
this is just the shape, not the answer.

## Task

Steps 1-2 are a design problem before they're an implementation one. Enable plan mode
and work through them with your agent — walk through [Things to
design](#things-to-design) together first — rather than asking it to freehand a
restricted agent and a skill in one shot.

1. **Set up a dedicated, restricted agent** for this job — one that can read
   anything, but can write anywhere under `todo-app/` *except* `todo-app/src/**` —
   the actual application code. It has no business changing app logic, only the
   harness and tooling around it. Resist the urge to narrow this further to just
   `todo-app/CLAUDE.md`/`AGENT.md`/`.claude/**`: real findings also produce mechanical
   fixes to files like `tsconfig.json` or `package.json` — harness/tooling config,
   not app logic — and an allow-list that excludes them forces a human decision on
   fixes that don't actually need one.
2. **Build a skill**, e.g. `.claude/skills/implement-harness-fix/`, that this agent
   runs: it reads `analysis.json`, decides for each finding whether it's safe to
   implement directly, needs a human decision, or needs more investigation.
3. **Run it** against your own (or the reference) `analysis.json` and let it act: for
   findings it can safely handle, it should actually make the change, commit it, and
   open a pull request (or produce the local-branch substitute from Prerequisites).
4. **Verify the write-restriction actually holds** — deliberately try to get the
   agent to touch `todo-app/src/**` and confirm it can't, rather than trusting that
   the deny rule you wrote does what you think it does.

This is a jump in blast radius from Exercise 2: that skill only ever wrote a JSON file
that nothing else read. This one writes real files and opens a real PR. The
write-restriction is exactly what makes that jump survivable — design it first, not
as an afterthought once the skill already works.

## Why you can't just point an unrestricted agent at `analysis.json` and say "fix these"

Walk through your own (or the reference) `analysis.json` and notice the findings
aren't equally safe to act on:

- **Mechanically verifiable.** E.g. "this hook is registered but every line is
  commented out" — checkable against the same file the finding cites. Safe to
  implement directly.
- **Correct diagnosis, fix needs a human decision.** E.g. two guide files give
  opposite instructions on autonomy — airtight finding, but *which* policy should win
  isn't in the data anywhere. An agent that picks one silently is guessing, not
  implementing.
- **Correct diagnosis, fix touches something unobservable.** E.g. a recurring failure
  depends on which shell/OS the team actually uses — something not settled by
  anything in `analysis.json`. Implementing a "fix" here isn't a fix, it's a guess
  dressed up as one.

An agent that treats all three the same and just starts editing files will produce
some good changes and some confidently wrong ones, indistinguishable in the resulting
PR unless you design for the difference up front.

## Things to design

Work through these with your agent, in plan mode, before it sets up the restricted
agent or builds the skill:

1. **Tool and permission design for the agent.** Beyond denying writes to
   `todo-app/src/**`: does it need unrestricted `Bash` (it has to run `git`/`gh`
   commands), or should that be scoped too? What's the actual risk of unrestricted
   `Bash` for an agent whose whole job is "implement a harness fix and open a PR"?
2. **Classifying findings before acting.** Does `analysis.json`'s schema need a new
   field for this (e.g. `fix_type: "mechanical" | "policy_decision" |
   "needs_investigation"`) — and if so, is it set by Exercise 2's skill, or computed
   fresh by this one?
3. **What the agent actually does per category.** Mechanical: implement for real —
   diff, commit, PR. Policy-decision: don't guess — surface the two (or more) options
   with tradeoffs, and either stop or open a draft PR that says so explicitly.
   Needs-investigation: don't touch anything — report the concrete next step.
4. **The permission boundary catches things the classification doesn't.** What
   happens when a "mechanical" finding's fix would actually need to touch
   `todo-app/src/**`? Does the agent refuse the whole finding, split it, or escalate
   to a human — and how does it notice this *before* attempting the write, not after
   it's denied?
5. **Refusing bad input.** What should happen if `analysis.json` is stale, or a
   finding's `evidence_session_ids` don't exist in `index.json`? Should the skill
   sanity-check its inputs before implementing anything from them?

## Success criteria

- The agent literally cannot write to `todo-app/src/**` — verified by actually trying
  to get it to, not just by reading the permission config and assuming it holds.
- Mechanical findings get implemented for real: a diff, a commit, a PR that traces
  back to the specific `analysis.json` finding and fix category that produced it.
- Policy-decision and needs-investigation findings are never silently "fixed" — they
  come out flagged, with the reasoning for *why* they weren't touched, not guessed at.
- If a finding's evidence didn't check out (stale, missing session IDs), the agent
  noticed and refused it rather than implementing anyway.
- Every tool the agent has access to has a one-sentence justification for why it
  needs it — you'll need this again in Exercise 4, when the HDR has to explain these
  decisions.

## Solution

See [`exercises/README.md`](README.md#reference-solutions) for how to check out
reference solutions without exposing them to your coding agent.
`exercises/solutions/exercise03/` (on the `solutions` branch) has a reference
restricted-agent definition, a reference skill design
(`implement-harness-fix-SKILL.md`), and an example of what it produces for each of
the three categories against `exercises/solutions/exercise02/analysis.json`. Attempt
your own design first — this one's meant for comparison, not copying.
