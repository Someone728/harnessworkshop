# HDR-0001: Scope `harness-fix-implementer`'s write access via an `agent_type`-checking hook, not a project-wide permission deny

- **Status:** accepted
- **Date:** 2026-09-07
- **Deciders:** agent (`harness-fix-implementer` design pass), human sign-off during Exercise 3
- **Harness area:** tools, hooks, permissions

## Context

Exercise 3 required a subagent (`harness-fix-implementer`) that can act on
`analysis.json` findings across all of `todo-app/` — `CLAUDE.md`, `AGENT.md`,
`.claude/**`, `tsconfig.json`, `package.json`, formatter config — without ever being
able to touch `todo-app/src/**`, the actual application code. The finding this agent
acts on can name a fix in any of those harness/tooling files, so its writable surface
had to be "all of `todo-app/` except `src/`," not a hand-picked list of specific
files.

### Evidence

- **Baseline:** before this agent existed, the only session in this repo touching
  harness files did so from the main session, with no scoping mechanism at all.
- **Observed evidence:** none from prior sessions — this is a forward-looking design
  decision made while building the agent in Exercise 3, not a fix for an observed
  incident. `exercise-3-implement-harness-fix.md`'s own text names the first
  instinct considered and rejected: a `.claude/settings.json` entry like
  `"deny": ["Edit(todo-app/src/**)"]`.
- **Relevant conditions:** the restriction needs to apply to exactly one subagent
  (`harness-fix-implementer`), not to the main session or any other agent working in
  the same repo, since ordinary work in `todo-app/src/` must stay unaffected.

## Decision

Enforce the write restriction with two `PreToolUse` hooks
(`harness-fix-write-guard.js` for `Edit|Write`, `harness-fix-bash-guard.js` for
`Bash`) that check `payload.agent_type === "harness-fix-implementer"` before blocking
anything — a no-op for every other session/agent. `harness-fix-write-guard.js` allows
writes anywhere under `todo-app/` except `todo-app/src/**`; `harness-fix-bash-guard.js`
restricts this agent's shell access to `git`, `gh`, and `node --check`, rejecting
chained/compound commands and a fixed list of destructive git invocations
(`--force`, `reset --hard`, `clean -f`, `branch -D`, `rebase -i`, `--no-verify`,
`commit.gpgsign=false`). The agent's own tool list (`Read, Grep, Glob, Edit, Write,
Bash`) additionally excludes `WebFetch`/`WebSearch` outright.

## Rationale

A project-wide `permissions.deny` rule (`"deny": ["Edit(todo-app/src/**)"]`) was the
first option considered and was rejected: it applies to every session and every agent
in the repo, not just this one, so it would have blocked the main session (and any
other agent) from ever editing `todo-app/src/**` — breaking ordinary application work
for everyone, not just scoping this one job. The hook-based approach is the only
mechanism that can see *who's calling* (`agent_type`) before deciding whether to
block, so it's the only one that scopes to a single agent without a global side
effect.

The `Bash` allow-list (`git`/`gh`/`node --check` only, no compound commands) exists
because this agent's entire job requires shell access for branch/commit/PR
operations, and unrestricted `Bash` would let it run arbitrary commands with no
scoping mechanism at all — the write-guard hook only inspects `Edit`/`Write` calls,
so without a matching `Bash` guard the write restriction could be defeated by shell
redirection (e.g. `echo ... > todo-app/src/x.ts`). `WebFetch`/`WebSearch` were left
off the tool list because nothing in this agent's job (read findings, verify
evidence, edit harness files, commit, open a PR) needs internet access, and granting
it would widen the agent's blast radius for no corresponding benefit.

_Not recorded: whether narrower alternatives to the `git`/`gh`/`node --check`
allow-list (e.g. omitting `node --check`) were explicitly considered and rejected —
`exercise-3-implement-harness-fix.md` and the agent/skill files don't record that
comparison, only the chosen allow-list and its purpose._

## Expected effect

**Hypothesis:**
If we scope `harness-fix-implementer`'s write and shell access through
`agent_type`-checked `PreToolUse` hooks instead of a project-wide deny rule, the
likelihood of this agent (or any fix it's instructed to make) reaching
`todo-app/src/**` should decrease to zero, while the likelihood of the write
restriction breaking unrelated sessions/agents working in `todo-app/src/` should also
decrease to zero.

## Consequences

- **Positive:** the restriction holds regardless of what the agent is told to do —
  a blocked write is enforced independently of the agent's own judgment, not just a
  matter of it declining.
- **Negative:** the enforcement logic now lives in two extra files
  (`harness-fix-write-guard.js`, `harness-fix-bash-guard.js`) that have to be kept in
  sync with the agent's name (`agent_type` string) if it's ever renamed.
- **Uncertain / possible regressions:** _Not recorded: no session data yet exists
  where this hook pairing was stress-tested against a genuinely adversarial attempt to
  route around it (e.g. via a symlink or a relative-path trick) — Exercise 3's success
  criteria call for "deliberately try to get the agent to touch `todo-app/src/**`,"
  but the specific attempts made and their results aren't captured in
  `analysis.json`/the agent files themselves._

## Validation

- **Signal / metric:** whether a deliberate attempt to get `harness-fix-implementer`
  to write to `todo-app/src/**` is blocked with exit code 2 from
  `harness-fix-write-guard.js`, not merely declined by the agent.
- **Evaluation method:** manually instruct the agent to edit a file under
  `todo-app/src/**` and inspect the hook's exit behavior directly (per Exercise 3's
  own "Verifying the write-restriction actually holds" section).
- **Evaluation window:** immediately after this agent/hook pair is first used, and
  again after any change to either hook file or to the agent's `agent_type`/name.
- **Success criteria:** the write is blocked at the hook level every time, and writes
  to `todo-app/tsconfig.json`/`todo-app/package.json` (outside `src/`) still succeed.
- **Reconsider / revert when:** a legitimate mechanical fix is found that requires
  touching something the current allow-list denies and that isn't actually
  application code (would indicate the `todo-app/src/` boundary itself needs
  revisiting, not just the hook).
- **Regression signals:** any session where this agent successfully writes to
  `todo-app/src/**`, or where an unrelated session/agent is unexpectedly blocked by
  either hook (would indicate the `agent_type` check is misfiring).

### Revalidation triggers

- The agent is renamed or a second agent needs the same scoped write pattern (would
  argue for factoring the check into a shared, name-parameterized hook instead of one
  hard-coded to `"harness-fix-implementer"`).
- `todo-app/`'s directory structure changes such that harness/tooling files start
  living outside `todo-app/` or application code starts living outside
  `todo-app/src/`.

## Result

<!-- Complete after validation. Do not modify the original evidence, rationale, or hypothesis. -->

_Not recorded: no validation pass has been run against this HDR yet._
