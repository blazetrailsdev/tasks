---
title: "unported-live-test-guard-is-red-with-vendor-populated"
status: draft
updated: 2026-10-01
rfc: "0127-fidelity-tooling-signals-and-hygiene"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`scripts/parity/unported-live-test.test.ts` is red on `main` whenever `vendor/` is
populated, and green in CI only because the Unit Tests job has no vendored sources: the
test returns early at its `if (total === 0) return;` guard ("Vendor not populated"). So the
recurrence guard for "a `tests:` entry names a live TS test" has not run in CI, and eight
entries have rotted. Found while enrolling thor in `parity:test` (trails PR for
`enroll-thor-specs-in-parity-test`); the failure reproduces with the thor entries removed.

Offenders, as the guard prints them (`pnpm vitest run scripts/parity/unported-live-test.test.ts`):

- `attribute_accessor_per_thread_test.rb` excludes "default value is accessible from other
  threads" — live at `packages/activesupport/src/core-ext/module/attribute-accessor-per-thread.test.ts:49`
  (entry: `scripts/parity/unported-files/activesupport.ts:280-286`)
- `core_ext/class/attribute_test.rb` excludes "works well with singleton classes" — live at
  `packages/activesupport/src/core-ext/class/attribute.test.ts:113`
- `connection_pool_test.rb` excludes "reap inactive" — live at
  `packages/activerecord/src/connection-pool.test.ts:251`
- `core_test.rb` excludes "inspect singleton instance" — live at
  `packages/activerecord/src/core.test.ts:72`
- `fixtures_test.rb` (class `FixturesTest`) excludes "complete instantiation" and "fixtures
  from root yml with instantiation" — live at `packages/activerecord/src/fixtures.test.ts:521,525`
- `fixtures_test.rb` (class `FixturesWithoutInstantiationTest`) excludes "without complete
  instantiation" and "fixtures from root yml without instantiation" — live at `:579,586`
- `fixtures_test.rb` (class `FixturesWithoutInstanceInstantiationTest`) excludes "without
  instance instantiation" — live at `:614`

Each is one of two things: the test really is ported and the entry (plus its
`unported-files/baseline.json` row) must be retired, so the Rails case counts again; or the
TS test of that name is not the Rails test and the entry needs a `liveTsCounterpart` receipt.
Read the Rails test and the TS test for each before choosing.

The guard also walks only `*_test.rb` (`walk`, `unported-live-test.test.ts:26-40`), so it
never checks a package whose suite is `spec_*.rb` (rack, rack-session) or `*_spec.rb`
(rack-test, thor).

## Acceptance criteria

- [ ] `pnpm vitest run scripts/parity/unported-live-test.test.ts` is green with `vendor/`
      populated: each of the nine cases above is either retired from the register (and from
      `baseline.json`) or carries a `liveTsCounterpart` receipt that says what the TS test
      asserts instead.
- [ ] The guard runs in a CI job that has the vendored sources (the Rails API/Test Comparison
      job), so it cannot rot again.
- [ ] The guard's walk covers `spec_*.rb` and `*_spec.rb` suites as well as `*_test.rb`.
- [ ] `pnpm parity:test` matched counts for activesupport and activerecord do not drop.
