---
title: "CONTRIBUTING assert_empty row (toHaveLength(0)) disagrees with the assertion-kind gate"
status: draft
updated: 2026-10-22
rfc: "0127-fidelity-tooling-signals-and-hygiene"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

CONTRIBUTING.md § "Porting a Minitest assertion" maps `assert_empty o` to `expect(o).toHaveLength(0)` by default, and to `toBeEmpty()` only when the receiver has no `length`. The assertion-kind gate (`scripts/test-compare/assertion-kinds.ts:96` `assert_empty: "empty"`, `:268` `toBeEmpty: "empty"`) has no `"empty"` mapping for `toHaveLength(0)`. So following the table reds the `assertion-mismatch` ratchet. trails#9221 hit this: 9 `assert_empty @logger.messages` ports in `packages/activejob/src/logging.test.ts` (Rails `activejob/test/cases/logging_test.rb:395` and later) counted as `length`, not `empty`, until they were switched to `toBeEmpty()`.

## Acceptance criteria

- The table and the gate agree. Either the gate classifies `toHaveLength(0)` with a literal `0` as `empty`, or the CONTRIBUTING row names `toBeEmpty()` as the default port of `assert_empty`.
- A test-compare unit test covers the chosen mapping.
