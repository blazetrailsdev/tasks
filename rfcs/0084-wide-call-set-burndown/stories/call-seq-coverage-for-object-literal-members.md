---
title: "callSeq for object-literal and arrow-function exports, so order parity covers the whole calls population"
status: done
updated: 2026-08-07
rfc: "0084-wide-call-set-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: 6165
claim: "2026-08-07T02:08:30Z"
assignee: "datetime-to-s-drops-the-time-of-day"
blocked-by: null
closed-reason: null
---

## Context

PR #6152 added `MethodInfo.callSeq` — the source-ordered call sequence
`compare.ts:reorderedCalls` compares against the Ruby body's `calls.uniq`
(`extract-ruby-api.rb:2043`) — but wired it at only three of the extractor's
call sites in `scripts/api-compare/extract-ts-api.ts`:

- class/interface members (`extract-ts-api.ts`, the `isMethodDeclaration` arm),
- constructors,
- exported top-level `function` declarations.

Two populations still record `calls` (sorted) with NO `callSeq`, so the
order-only comparison silently does not run for them — a reordered body there is
invisible, with no row and no signal that the check was skipped:

- members of an exported object literal, `export const X = { method() {...} }`
  (the `extractFromObjectLiteral` walk) — this is how arel's visitor tables and
  several module-function namespaces are declared;
- `export const f = (…) => {…}` / `function` expression forms resolved through
  the variable-statement arm.

## Acceptance criteria

- [ ] Every extractor site that emits `calls` also emits `callSeq`, so the
      order-only check covers the same population as the missing-call check.
- [ ] A test at the top level of `scripts/api-compare/` covers an object-literal
      member and an arrow-function export, asserting `calls` stays sorted and
      `callSeq` is source-ordered (mirror the existing "also records the same
      calls in source order" test).
- [ ] Any newly surfaced order-only rows are seeded into
      `call-mismatches-exclude/` via `serializeBaseline` with an
      ordering-specific reason — never `--write`/reseed — and sorted with
      `compareKeys` (code-unit, NOT `localeCompare`: that mis-collates keys
      differing past a punctuation character, e.g. `joins!` vs `joins_values`,
      and reds the reseed-drift gate).
- [ ] `pnpm parity:api:calls` green; the reseed-drift check (`lint-call-mismatches.ts
--write` leaving both baseline trees byte-identical) green.
