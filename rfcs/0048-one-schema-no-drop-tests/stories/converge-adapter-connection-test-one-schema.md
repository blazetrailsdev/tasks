---
title: "converge-adapter-connection-test-one-schema"
status: in-progress
updated: 2026-06-30
rfc: "0048-one-schema-no-drop-tests"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 4350
claim: "2026-06-30T20:35:56Z"
assignee: "converge-adapter-connection-test-one-schema"
blocked-by: null
---

## Context

Follow-up to `converge-adapter-one-schema` (PR #4344), which converged the
`AdapterTest` class in `packages/activerecord/src/adapter.test.ts` to a faithful
port of `vendor/rails/activerecord/test/cases/adapter_test.rb`. The remaining
classes in that same file still diverge from Rails and must be converged under
the RFC 0048 binding Convergence contract (faithful word-for-word port, ride
canonical schema, no bespoke tables, fix impl not test).

Remaining divergent clusters in `adapter.test.ts`:

- **`AdapterConnectionTest`** (Rails adapter_test.rb:513-931, gated
  `unless in_memory_db?`): trails replaced the real remote-disconnect /
  reconnect / retry integration tests with unit-level tests against bespoke
  fake adapters (`LifecycleTestAdapter`, `QueryTestAdapter`,
  `ExecuteRetryAdapter`, `ConfigureFailureAdapter`) AND a set of
  trails-invented test names that exist nowhere in Rails (e.g.
  "a from(Arel node) clause does not reset the SELECT's retryable
  classification", "findBySql tolerates a null opts argument", "execQuery
  options type accepts allowRetry alongside prepare", "withRawConnection is
  reentrant").
- **`describe("AbstractAdapter reconnect/verify lifecycle")`**: an entire
  bespoke describe block with no Rails counterpart — all invented names.
- **`AdapterThreadSafetyTest`** (adapter_test.rb:933-977): permanently skipped
  (Ruby GVL-only) — verify the SKIP_GROUPS / unported-files rationale is
  recorded, leave skipped.

## Acceptance criteria

- [ ] `AdapterConnectionTest` mirrors adapter_test.rb test-by-test (names
      verbatim), gated faithfully on a non-in-memory adapter (MySQL/PG); the
      in-memory-skipped cases stay skipped rather than being replaced by
      invented unit tests.
- [ ] Delete the bespoke `describe("AbstractAdapter reconnect/verify lifecycle")`
      block and any invented-name `it`s; port the real Rails cases that cover
      that behavior, or move genuinely-trails-only unit coverage to a
      non-`*.test.ts`-named home that `test:compare` does not map to Rails.
- [ ] Remove now-unused bespoke fake-adapter classes once their invented tests
      are gone.
- [ ] Surfaced impl gaps → fix impl or file under `0023-surfaced-deviations`;
      do not bend the test. Temporary `test:compare` regression acceptable —
      record the un-skip.
- [ ] 500-LOC ceiling; single PR from main; all-or-nothing per cluster.
