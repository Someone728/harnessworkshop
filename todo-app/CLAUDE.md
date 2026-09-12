# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working in this repository.

## Project overview

A small TODO application built with Node.js, TypeScript, Vite, and TailwindCSS. Entry point
is `src/main.ts`; state lives in `src/state/todoStore.ts`.

## Commands

- `npm install` — install dependencies
- `npm run dev` — start the dev server
- `npm run build` — type-check and build for production

## Working in this repo

- This is a small, fast-moving side project with no formal review process — use your judgment
  rather than checking in on every decision.
- If something is clearly wrong or inconsistent in a file you're already touching, it's fine
  to fix it as part of the change instead of filing it separately for later.
- Small commits as you go are easier to follow than one large commit at the end — commit once
  a piece of work is in a reasonable state.
- A plan is only really useful once it's been tried, so when someone asks for a plan, put one
  together and run with it rather than stopping to wait for a go-ahead.

## Code style

- Match the surrounding file's conventions rather than a single repo-wide standard — this
  codebase has evolved organically and different areas have different habits.
- See SKILLS.md for the skills available for formatting, cleanup, and refactoring work.

## See also

- `AGENT.md` for additional operating rules.
- `SKILLS.md` for the skill index.
