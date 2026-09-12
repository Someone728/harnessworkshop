# TODO App

A small, realistic-looking codebase and its **agent harness** — the instructions,
skills, and hooks that shape how a coding agent (Claude Code or similar) behaves in a
repository — used as the subject under investigation in the
[Agent Harness Workshop](../README.md).

## What's in here

- **A TODO app.** Node.js + TypeScript + TailwindCSS, built with Vite. It works, but it wasn't
  written carefully: naming conventions vary from file to file, there's a redundant
  abstraction layer, and a couple of overlapping types that don't need to both exist. That's
  deliberate — it's meant to resemble a codebase that grew without much oversight, the kind
  agents run into constantly.
- **An agent harness.** `CLAUDE.md`, `AGENT.md`, individual skill files under
  `.claude/skills/`, and hooks under `.claude/hooks/` / `.claude/settings.json`. The harness is
  also imperfect, on purpose — that's the actual subject of the workshop (CLAUDE.md even
  references a `SKILLS.md` that doesn't exist — that's one of the things to find, not a typo
  to fix).

## Getting started

```
npm install
npm run dev
```

Then open the printed local URL. `npm run build` type-checks and builds for production.

## How the workshop works

You don't need to use this app yourself to do the workshop — `harness-logs/` (at the
repo root) already contains two weeks of real-looking session transcripts of an agent
working in this codebase. The workshop walks through five exercises, from repo root,
that take you from those raw transcripts to an actual reviewed harness fix:

1. **Group** — cluster session transcripts by real shared cause, not shared
   vocabulary — no reasoning yet, just what's wrong and where.
2. **Analyze** — turn those groups into real, evidenced findings: why it matters, a
   recommendation, a confidence level.
3. **Implement** — actually make the change and open a PR — through an agent that's
   deliberately restricted from touching this app's production code.
4. **Document** — record *why* the harness changed, not just what changed, in the
   same PR (a Harness Decision Record).
5. **Validate** — check a proposed harness change before it's approved.

See the repo root [`README.md`](../README.md) and [`MISSION_BRIEFING.md`](../MISSION_BRIEFING.md)
to get started, and `exercises/` for each exercise in detail. Every surprising
behavior these exercises turn up has a cause somewhere in this app's harness —
`CLAUDE.md`, `AGENT.md`, a skill file, or a hook — the exercises are about tracing
behavior back to that cause using evidence, not guesswork.

## Project layout

```
src/
  main.ts                    entry point
  types.ts                   core Task type
  Todo.ts                    a second, overlapping TodoItem type
  state/todoStore.ts         app state
  features/todo/todoFeature.ts   a thin wrapper around the store
  components/                mixed naming conventions on purpose
  utils/                     storage + misc helpers
CLAUDE.md / AGENT.md          (CLAUDE.md references a missing SKILLS.md — see above)
.claude/skills/               individual skill definitions
.claude/hooks/, .claude/settings.json   hook wiring
```
