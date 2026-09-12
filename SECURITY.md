# Security Policy

## Scope

This repo is workshop material: a small TODO app (`todo-app/`), fabricated
session transcripts (`harness-logs/`), exercise instructions, and Node.js
scripts that process those transcripts into structured JSON.

**The harness inside `todo-app/` (its `CLAUDE.md`, `AGENT.md`, hooks, and
skills) is *intentionally* imperfect** — dead hooks, contradictory
instructions, a broken build config, and similar issues are the subject
matter of the workshop, not vulnerabilities. Please don't file security
reports against the deliberately-planted flaws described in the exercises;
open a regular issue instead if something about them is unclear or
inconsistent with what the exercises claim.

Real security concerns this policy does cover:

- A vulnerability in the actual Node.js scripts under `.claude/skills/*/scripts/`
  (e.g. something that lets processing an untrusted `harness-logs/`-style
  input execute arbitrary code, escape the intended output directory, or
  leak data it shouldn't).
- A vulnerability in `todo-app/`'s own dependencies or build tooling
  unrelated to the intentionally-planted harness issues.
- Any credential, token, or personal data accidentally committed to this
  repo's history.

## Reporting a Vulnerability

Please report security concerns privately rather than opening a public
issue: email **jurrebrandsen@gmail.com** with a description of the
issue and, if possible, steps to reproduce it.

You should expect an acknowledgment within a few business days. This is a
workshop repo maintained on a best-effort basis, not a funded security
response team — please be patient.

## Disclosure

Once a reported issue is understood and (if applicable) fixed, we'll credit
the reporter in the fix's commit message or changelog unless you'd prefer to
stay anonymous.
