---
title: "Burn down 320 extra (TS-only) tests in calculations.test.ts"
status: claimed
updated: 2026-06-25
rfc: "0043-bespoke-test-bloat-burndown"
cluster: extra-burndown
deps: []
deps-rfc: []
est-loc: 500
priority: 2
pr: null
claim: "2026-06-25T15:26:52Z"
assignee: "calculations-extra-burndown"
blocked-by: null
---

## Context

`packages/activerecord/src/calculations.test.ts` carries **320 extra (TS-only) tests** -- `it`/`test`
declarations matching no Rails test (`test:compare` snapshot 2026-06-23,
matched=233, rubyTestCount=233). Per RFC 0043 these are
bloat to retire. Rails counterpart:
`vendor/rails/activerecord/test/cases/calculations_test.rb`.

Re-derive the exact current `extra` count from a fresh
`pnpm test:compare --package activerecord --json` run before starting (the
snapshot above may have drifted).

## Acceptance criteria

- Read the Rails counterpart FIRST. Classify each extra `it` per the RFC triage:
  **MOVE** (exists in Rails elsewhere -> out of scope, leave for the
  misplaced/wrong-describe workflow), **DELETE** (no Rails equivalent, no trails
  invariant -> default), or **RELOCATE** (guards a documented trails-specific
  invariant -> move verbatim into a sibling `*.trails.test.ts`). When unsure,
  relocate, don't delete.
- **One file per PR:** touch only `packages/activerecord/src/calculations.test.ts` (optionally its sibling
  `*.trails.test.ts`). Exempt from the 500-LOC ceiling (pure-deletion carve-out).
- `extra`/`totalExtra` for this file drops; `matched`, `matchedSkipped`,
  `missing`, `wrongDescribe`, `misplaced` stay **bit-for-bit unchanged** (verify
  with `pnpm test:compare --package activerecord`).
- No test renamed or reworded; the remaining file passes
  (`pnpm vitest run packages/activerecord/src/calculations.test.ts`).

## Definition of done

The file's `extra` count drops toward zero with parity metrics unchanged. An
`eslint-disable`, a reworded test, or a changed parity metric does not close this.
