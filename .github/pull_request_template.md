## What this changes

## Which branch

- [ ] This targets `master` (exercises, todo-app, meta-tooling)
- [ ] This targets `solutions` (reference solutions)
- [ ] Both — and I've opened **separate PRs** against each branch, since they
      should never be merged into one another directly

## If this touches an exercise's output schema or task

- [ ] I checked whether downstream exercises that consume this exercise's
      artifact still make sense
- [ ] I checked whether the reference solution on `solutions` needs a
      matching update

## If this makes a technical claim (about Claude Code, git, gh, or any tool)

- [ ] I verified this against current official documentation and can cite
      where (link in the description above) — see `CONTRIBUTING.md` for why
      this matters here specifically

## Checklist

- [ ] I ran the relevant extraction script(s) if I touched `.claude/skills/*/scripts/`
      and confirmed the output looks sane
- [ ] I didn't introduce any absolute, machine-specific paths into committed
      output
