---
title: "insert_all serialize round-trip consistency (RETURNING)"
status: in-progress
updated: 2026-06-20
rfc: "0030-ar-test-compare-residual-burndown"
cluster: persistence
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: 3746
claim: "2026-06-20T22:57:28Z"
assignee: "insert-all-serialize-array-name-consistency"
blocked-by: null
---

## Context

`packages/activerecord/src/insert-all.test.ts` "insert with type casting and
serialize is consistent" is gated to `insert_returning` but `ctx.skip()`-pending.
Rails passes an array as the (string) `Book#name` and relies on `serialize`
round-tripping the value through insert_all's RETURNING path
(`insert_all_test.rb:51` area). trails' canonical `Book.name` is a plain string
type, so the test needs a serialize-typed attribute to exercise the behavior.
Cited tracking story `d2-insert-all-returning-result` is closed (done) but this
test was never implemented.

## Acceptance criteria

- [ ] Exercise serialize round-trip consistency through insert_all RETURNING,
      using a canonical model with a serialize-typed attribute (no bespoke
      schema; mirror Rails' model).
- [ ] Drop `ctx.skip()`; test runs where `supports_insert_returning?`.
- [ ] `test:compare` delta non-negative; test name unchanged.
