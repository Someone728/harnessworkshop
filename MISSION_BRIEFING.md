# Mission Briefing

## The situation

For the past two weeks, an AI coding agent has been working in `todo-app/`, a small
TODO app. Every session in `harness-logs/` is a real (fabricated, but realistic)
transcript from that work. The pattern across them: bugs that were already fixed keep
coming back, style keeps drifting, and a couple of sessions end with a human blocking
something the agent tried to do on its own initiative.

Nobody has actually gone back and read the transcripts. Today, that's your job.

## What's a harness?

A "harness" is everything that shapes how a coding agent behaves in a repo, beyond
the model itself. It splits into two kinds of control:

- **Guides** steer the agent *before* it acts — `CLAUDE.md`/`AGENT.md`, skills,
  permissions.
- **Sensors** observe *after* it acts — hooks.

A harness is never finished. Guides go stale, contradict each other, or point at
files that don't exist. Sensors get registered and then quietly stop firing. None of
this throws an error — it just changes what the agent does, session after session,
until someone notices the pattern.

## Why it matters

An agent is only as reliable as the harness around it. A contradiction between two
instruction files, a hook that's been commented out, a skill with a vague
description — none of these show up as a stack trace. They show up later, as a
regression nobody can explain, or as the agent doing something nobody actually agreed
to. Safety nets you can't verify are still working aren't safety nets.

The only way to catch this is evidence: what the agent actually did, in the actual
transcripts, not what the harness *claims* it does.

## What you'll do today

Five exercises, in order, from raw evidence to an actual reviewed and validated
harness fix:

1. **Analyze.** Read `harness-logs/` (via the mechanical extraction pipeline already
   built) and write down real findings: specific harness component, specific
   evidence, reasoning, a recommendation, a confidence level. Not vibes, not
   aggregates — claims someone else could check.
2. **Propose.** Turn those findings into something a human can act on. Not every
   finding deserves the same treatment: some fixes are mechanical and safe to apply
   as-is, some need a human to make a call the data doesn't settle, and some need
   more digging before anyone touches anything.
3. **Prepare.** Take an approved proposal and actually apply it — through an agent
   deliberately denied write access to this app's production code. You design what
   tool access it actually needs, and defend that choice.
4. **Document.** Not every change needs a paper trail, but a meaningful one does:
   record *why* the harness changed, in the same pull request as the change itself.
5. **Validate.** Before a change is approved, check it against its evidence and its
   record — the same rigor you applied in step 1, now applied as a gate.

## Ground rules

- **Read before concluding.** A finding without a session ID attached is a guess.
- **Name the specific thing.** "Something seems off" isn't a finding.
- **Propose, don't apply.** A human always decides what actually changes.

## Next

Head to [`exercises/exercise-1-analysis-skill.md`](exercises/exercise-1-analysis-skill.md).
