# Agent Harness Workshop

A hands-on workshop on auditing and fixing AI coding agent harnesses — the
instructions, skills, and hooks that shape how a coding agent behaves in a
repository — using real session-transcript evidence instead of guesswork.

Start here: **[MISSION_BRIEFING.md](MISSION_BRIEFING.md)**.

## What's in this repo

- **`todo-app/`** — a small TODO app and its harness (`CLAUDE.md`, `AGENT.md`,
  `.claude/skills/`, `.claude/hooks/`). This is the harness under investigation. It's
  imperfect on purpose — that's the subject of the workshop.
- **`harness-logs/`** — fabricated raw session transcripts: roughly two weeks of an
  agent working in `todo-app/`. This is your evidence.
- **`exercises/`** — five hands-on exercises, from raw evidence to a reviewed and
  validated harness fix. Reference solutions, where they exist, live on a separate
  `solutions` branch (never on `master`) — see [`exercises/README.md`](exercises/README.md).
- **`.claude/`** (repo root) — this repo's own meta-tooling: the `session-logs` and
  `harness-snapshot` skills that turn `harness-logs/` into the structured artifacts
  the exercises work from.

## Prerequisites

- Claude Code (or an equivalent coding agent) installed and working.
- Node.js, to run the extraction scripts. `npm install` inside `todo-app/` is only
  needed if you want to run the TODO app itself — not required for either exercise.

## How the workshop flows

Two ways to run this: **full track** (~60 minutes) works through all five exercises
in order; **fast track** (~20 minutes) uses the
[fast-track booster](exercises/README.md#fast-track) to fully complete exercises 1–2
for you, so you can jump straight into exercise 3 and still experience the hands-on
part of the workshop.

1. **Mission briefing** — [`MISSION_BRIEFING.md`](MISSION_BRIEFING.md). Orientation:
   what a harness is, why it matters, what you'll do today.
2. **Exercise 1 — Group** — [`exercises/exercise-1-analysis-skill.md`](exercises/exercise-1-analysis-skill.md).
   Turn raw session logs into `groups.json`: sessions clustered by real shared cause,
   not shared vocabulary. No reasoning yet.
3. **Exercise 2 — Analyze** — [`exercises/exercise-2-analyze-groups-skill.md`](exercises/exercise-2-analyze-groups-skill.md).
   Turn those groups into `analysis.json`: fully-reasoned findings with why it
   matters, a recommendation, and a confidence level.
4. **Exercise 3 — Implement** — [`exercises/exercise-3-implement-harness-fix.md`](exercises/exercise-3-implement-harness-fix.md).
   Actually change the harness and open a PR, through an agent deliberately denied
   write access to production code. Design what tool access it actually needs.
5. **Exercise 4 — Document** — [`exercises/exercise-4-hdr.md`](exercises/exercise-4-hdr.md).
   Record *why* the harness changed, not just what changed, in the same PR.
6. **Exercise 5 — Validate** — [`exercises/exercise-5-validation.md`](exercises/exercise-5-validation.md).
   Check a proposed harness change against its evidence and its Harness Decision
   Record before the PR is approved.

See [`exercises/README.md`](exercises/README.md) for the full outline and for how to
check out reference solutions without exposing them to your coding agent — don't open
them before attempting the exercise yourself.

## Keeping solutions away from your coding agent

Solutions live on a separate `solutions` branch, not on `master`, specifically so
they're never sitting in the working directory a coding agent operates in while
you're doing an exercise. `.claude/settings.json` also denies the `Read`/`Grep`/`Glob`
tools from reading `exercises/solutions/**` as a second layer, in case that path ever
ends up in your working tree anyway (e.g. after checking a solution branch out
in-place instead of into a separate worktree) — in Claude Code this also blocks
`Bash` commands like `cat`/`grep` whose arguments target the denied path, not just its
own dedicated tools. Neither layer is a substitute for the other, though: keep
solutions on a separate branch/worktree as the primary guarantee, and treat the
permission rule as a backstop — it's Claude Code-specific and won't apply if
participants use a different coding agent.
