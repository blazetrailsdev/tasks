---
title: "Burn down 63 extra (TS-only) tests in core.test.ts"
status: in-progress
updated: 2026-06-25
rfc: "0043-bespoke-test-bloat-burndown"
cluster: extra-burndown
deps: []
deps-rfc: []
est-loc: 150
priority: 18
pr: 4155
claim: "2026-06-25T21:47:15Z"
assignee: "core-extra-burndown"
blocked-by: null
---

## Context

`packages/activerecord/src/core.test.ts` carries **63 extra (TS-only) tests** -- `it`/`test`
declarations matching no Rails test (`test:compare` snapshot 2026-06-23,
matched=24, rubyTestCount=24). Per RFC 0043 these are
bloat to retire. Rails counterpart:
`vendor/rails/activerecord/test/cases/core_test.rb`.

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
- **One file per PR:** touch only `packages/activerecord/src/core.test.ts` (optionally its sibling
  `*.trails.test.ts`). Exempt from the 500-LOC ceiling (pure-deletion carve-out).
- `extra`/`totalExtra` for this file drops; `matched`, `matchedSkipped`,
  `missing`, `wrongDescribe`, `misplaced` stay **bit-for-bit unchanged** (verify
  with `pnpm test:compare --package activerecord`).
- No test renamed or reworded; the remaining file passes
  (`pnpm vitest run packages/activerecord/src/core.test.ts`).

## Definition of done

The file's `extra` count drops toward zero with parity metrics unchanged. An
`eslint-disable`, a reworded test, or a changed parity metric does not close this.
