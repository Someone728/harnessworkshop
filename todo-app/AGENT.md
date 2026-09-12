# AGENT.md

Operating rules for any agent (Claude Code or otherwise) working in this repository. This is
a small TODO app built with Node.js, TypeScript, Vite, and TailwindCSS — see `README.md` for
the full project description.

## Autonomy

- Do not commit changes automatically. Always leave commits to the user unless they've
  explicitly asked you to commit in the current conversation.
- Stay scoped to what was asked. If you spot an unrelated improvement, mention it instead of
  making the change — don't refactor code you weren't asked to touch.
- When the user asks for a plan, write the plan and stop there. Wait for them to say "go"
  before making any changes.

## Style

- Follow the existing formatting conventions used elsewhere in `src/`.
- Keep changes minimal and easy to review.

## Testing

- There is no test suite configured yet. Run `npm run build` to type-check before considering
  a change done.
