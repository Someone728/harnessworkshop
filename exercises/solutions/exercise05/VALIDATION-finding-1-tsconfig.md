# Validation: finding #1 (tsconfig.json include path)

Worked example of the `## Validation` section a PR for
`exercises/solutions/exercise02/analysis.json` group 1 would carry, per the light
path (no HDR was warranted — see `exercises/solutions/exercise04/hdr-flow-addendum.md`).

- **Finding:** group 1, "The only verification command named in the harness has been
  broken since a directory move."
- **HDR:** none — a single-answer path fix has no live-behavior alternative.
- **Checks run:** 1 (traceability), 2 (evidence), 5 (scope) only — 3/4/6 don't apply
  without an HDR or a cross-file contradiction.

## Checks

**1. Traceability — PASS**
`recommendation` says: 'change `"include": ["todo-app/src"]` to `"include": ["src"]`'
in `todo-app/tsconfig.json`. The diff changes exactly that line, in exactly that
file, and touches nothing else.

**2. Evidence still holds — PASS**
`why_it_matters` claims all 9 `evidence_session_ids` sessions hit "the byte-identical
TS18003 failure ... include paths were [\"workshop/src\"]" before this fix. Re-reading
`todo-app/tsconfig.json` pre-diff confirms `include: ["todo-app/src"]` was present
(the specific broken value the claim describes), and every id in
`evidence_session_ids` resolves in `index.json`.

**5. Scope — PASS**
The diff touches only `todo-app/tsconfig.json`, which is inside `todo-app/` and
outside `todo-app/src/**`. No other file is touched.

## Result

All checks `PASS`. **Ready for review.**
