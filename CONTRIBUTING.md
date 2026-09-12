# Contributing

Thanks for considering a contribution. This repo has a couple of structural
quirks worth knowing before you open a PR.

## Branch structure — read this first

- **`master`** is the template branch — what people get via "Use this
  template" or a fresh clone. It contains the exercises, the `todo-app/`
  harness under investigation, `harness-logs/` (the fabricated dataset), and
  this repo's own meta-tooling.
- **`solutions`** is a *separate, unmerged* branch holding reference
  solutions for each exercise. It's deliberately kept off `master` so a
  coding agent helping someone with an exercise never has the answer key in
  its working tree. See [`exercises/README.md`](exercises/README.md) for how
  to check it out safely (a `git worktree`, not a merge).

**If your PR touches an exercise, check whether its reference solution needs
updating too**, and open that as a separate PR against `solutions`. Never
merge `solutions` into `master` or vice versa.

## Making changes to exercises

- Each exercise follows the same section skeleton: intro → Setup/Task → a
  "why the naive approach fails" section → Design questions (where
  applicable) → Success criteria → Solution (where one exists). Keep new or
  edited exercises consistent with that shape.
- If you change an exercise's output schema (e.g. what fields `groups.json`
  or `analysis.json` carry), the corresponding reference solution and every
  downstream exercise that consumes that artifact need to stay in sync —
  trace the whole chain, not just the one file you're editing.
- Every claim about *why* something in the harness matters should be
  traceable to a specific session ID in `harness-logs/`. Don't add findings
  or examples that can't be checked against the actual dataset.

## Making technical claims about Claude Code (or any tool)

If your change asserts how a specific mechanism works (a permission rule, a
hook payload field, a subagent setting, a `git`/`gh` flag), verify it against
current official documentation before submitting — this repo has already
shipped and had to fix one confident-but-wrong claim about permission
scoping. Cite what you verified in the PR description.

## Testing changes to the meta-tooling

If you touch `.claude/skills/*/scripts/*.mjs`, re-run both from the repo
root and confirm the output is sane before opening a PR:

```
node .claude/skills/harness-snapshot/scripts/generate-harness-snapshot.mjs
node .claude/skills/session-logs/scripts/generate-sessions.mjs harness-logs
```

Check that `project_dir`/`logs_dir` in the output are relative paths, not an
absolute path baked in from your machine — this repo is a public template,
and machine-specific paths in committed artifacts have bitten it before.

## Style

- Second person, direct, no filler. If you can cut a sentence without losing
  information, cut it.
- Prefer a concrete example (a real session ID, a real file, a real diff)
  over an abstract description whenever one is available.
- Don't add a comment or a paragraph that just restates what the code/text
  next to it already says.

## Opening a PR

- Keep PRs scoped to one exercise or one concern where possible — the
  artifact chain across exercises makes broad, unrelated changes hard to
  review together.
- Describe what you verified, not just what you changed, for anything making
  a factual or technical claim.

## Code of Conduct

This project follows the [Contributor Covenant](CODE_OF_CONDUCT.md).
