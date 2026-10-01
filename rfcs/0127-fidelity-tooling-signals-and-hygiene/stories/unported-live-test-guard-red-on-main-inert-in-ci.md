---
title: "unported-live-test guard is red on main for 10 stale exclusions and inert in CI"
status: closed
updated: 2026-10-01
rfc: "0127-fidelity-tooling-signals-and-hygiene"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "duplicate of unported-live-test-guard-is-red-with-vendor-populated (filed 2026-09-30, same RFC); that story lists 8 offenders, the guard now prints 10 — add fixtures_test.rb FixturesWithoutInstantiationTest 'visibility of accessor method' (fixtures.test.ts:587)"
---

## Context

`scripts/parity/unported-live-test.test.ts` ("no `tests:` entry names a live test in the mirroring TS file") is red on main when `vendor/` is populated, and green in CI only because the Unit Tests job has no vendored Rails: the test returns early at "Vendor not populated (bare checkout) — nothing to check" (`unported-live-test.test.ts:57-58`). Seen while working trails#8331, on main at the time of that PR's rebase.

It reports 10 `UNPORTED_FILES` per-test exclusions that name a test the port already defines as live:

- `attribute_accessor_per_thread_test.rb` "default value is accessible from other threads" — `packages/activesupport/src/core-ext/module/attribute-accessor-per-thread.test.ts:49`
- `core_ext/class/attribute_test.rb` "works well with singleton classes" — `packages/activesupport/src/core-ext/class/attribute.test.ts:113`
- `fixtures_test.rb` (FixturesTest) "complete instantiation", "fixtures from root yml with instantiation" — `packages/activerecord/src/fixtures.test.ts:518,522`
- `fixtures_test.rb` (FixturesWithoutInstantiationTest) "without complete instantiation", "fixtures from root yml without instantiation", "visibility of accessor method" — `fixtures.test.ts:576,583,587`
- `fixtures_test.rb` (FixturesWithoutInstanceInstantiationTest) "without instance instantiation" — `fixtures.test.ts:616`
- `connection_pool_test.rb` "reap inactive" — `packages/activerecord/src/connection-pool.test.ts:251`
- `core_test.rb` "inspect singleton instance" — `packages/activerecord/src/core.test.ts:72`

Each exclusion hides a test from `parity:test` that is in fact ported, so the matched count under-reports and the exclusion reason is false. trails#8331 retired one such row (MySQL "raises Deadlocked when a deadlock is encountered") the same way.

## Acceptance criteria

- [ ] For each of the 10 entries: confirm the TS test is the port of the Rails test (read the Rails case), then delete the entry from the `scripts/parity/unported-files/*.ts` file that holds it and its row in `scripts/parity/unported-files/baseline.json` by hand (no reseed). Where the TS test of that name is not the Rails test, record a `liveTsCounterpart` receipt instead.
- [ ] `pnpm vitest run scripts/parity/unported-live-test.test.ts scripts/parity/unported-files.test.ts` passes with `vendor/` populated.
- [ ] The guard runs somewhere in CI with vendored Rails present (for example the Rails API/Test Comparison job), so it cannot go red on main unnoticed again.
- [ ] `pnpm parity:test` delta non-negative.
