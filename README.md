# Agent Harness Workshop

> **You're on the `solutions` branch.** This holds reference solutions for the
> exercises. If you're here to *attempt* an exercise, switch to `master` first —
> checking these out into your working directory defeats the point. See
> `exercises/README.md` on `master` for the recommended way to check solutions out
> (a separate `git worktree`) without exposing them to your coding agent.

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
  validated harness fix. Reference solutions, where they exist, live under
  `exercises/solutions/`.
- **`.claude/`** (repo root) — this repo's own meta-tooling: the `session-logs` and
  `harness-snapshot` skills that turn `harness-logs/` into the structured artifacts
  the exercises work from.

## Prerequisites

- Claude Code (or an equivalent coding agent) installed and working.
- Node.js, to run the extraction scripts. `npm install` inside `todo-app/` is only
  needed if you want to run the TODO app itself — not required for either exercise.

## How the workshop flows

1. **Mission briefing** — [`MISSION_BRIEFING.md`](MISSION_BRIEFING.md). Orientation:
   what a harness is, why it matters, what you'll do today.
2. **Exercise 1 — Analyze** — [`exercises/exercise-1-analysis-skill.md`](exercises/exercise-1-analysis-skill.md).
   Turn raw session logs into real, evidenced findings.
3. **Exercise 2 — Propose** — [`exercises/exercise-2-propose-fixes-skill.md`](exercises/exercise-2-propose-fixes-skill.md).
   Turn those findings into reviewable proposed fixes — never applied automatically.
4. **Exercise 3 — Prepare** — take an approved proposal and actually apply it,
   opening a PR through an agent deliberately denied write access to production
   code. Design what tool access that agent actually needs.
5. **Exercise 4 — Document** — [`exercises/exercise-4-hdr.md`](exercises/exercise-4-hdr.md).
   Record *why* the harness changed, not just what changed, in the same PR.
6. **Exercise 5 — Validate** — [`exercises/exercise-5-validation.md`](exercises/exercise-5-validation.md).
   Check a proposed harness change against its evidence and its Harness Decision
   Record before the PR is approved.

See [`exercises/README.md`](exercises/README.md) for the full outline. Reference
solutions, where they exist, live in `exercises/solutions/` — don't open them before
attempting the exercise yourself.
