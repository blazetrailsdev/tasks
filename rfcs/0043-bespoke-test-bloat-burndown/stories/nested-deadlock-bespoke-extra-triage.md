---
title: "Burn down 3 extra (TS-only) tests in nested-deadlock.test.ts"
status: in-progress
updated: 2026-06-26
rfc: "0043-bespoke-test-bloat-burndown"
cluster: extra-burndown
deps: []
deps-rfc: []
est-loc: 30
priority: 22
pr: 4163
claim: "2026-06-25T23:47:24Z"
assignee: "nested-deadlock-bespoke-extra-triage"
blocked-by: null
---

## Context

`packages/activerecord/src/adapters/abstract-mysql-adapter/nested-deadlock.test.ts` carries **3 extra (TS-only) tests** -- `it`/`test`
declarations matching no Rails test (`test:compare` snapshot 2026-06-23,
matched=0, rubyTestCount=0). Per RFC 0043 these are
bloat to retire. Rails counterpart:
`vendor/rails/activerecord/test/cases/adapters/abstract_mysql_adapter/nested_deadlock_test.rb`.

This file's paired Rails test (`adapters/abstract_mysql_adapter/nested_deadlock_test.rb`) maps **zero** tests in `test:compare` (its `it`s are all TS-only). Such connection/adapter infra tests are prime **RELOCATE** candidates (trails-specific invariants -> `*.trails.test.ts`) rather than DELETE -- triage each against the Rails file before removing.

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
- **One file per PR:** touch only `packages/activerecord/src/adapters/abstract-mysql-adapter/nested-deadlock.test.ts` (optionally its sibling
  `*.trails.test.ts`). Exempt from the 500-LOC ceiling (pure-deletion carve-out).
- `extra`/`totalExtra` for this file drops; `matched`, `matchedSkipped`,
  `missing`, `wrongDescribe`, `misplaced` stay **bit-for-bit unchanged** (verify
  with `pnpm test:compare --package activerecord`).
- No test renamed or reworded; the remaining file passes
  (`pnpm vitest run packages/activerecord/src/adapters/abstract-mysql-adapter/nested-deadlock.test.ts`).

## Definition of done

The file's `extra` count drops toward zero with parity metrics unchanged. An
`eslint-disable`, a reworded test, or a changed parity metric does not close this.
