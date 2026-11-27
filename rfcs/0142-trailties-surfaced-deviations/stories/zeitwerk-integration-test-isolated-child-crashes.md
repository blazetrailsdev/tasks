---
title: "zeitwerk-integration.test.ts: isolated child exits silently; tracked classes and once-autoloader tests fail"
status: in-progress
updated: 2026-11-27
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: trails#10854
claim: "2026-11-27T18:44:45Z"
assignee: "trailties-tests-broken-while-shards-ran-zero"
blocked-by: null
closed-reason: null
---

## Context

`packages/trailties/test/application/zeitwerk-integration.test.ts` (ported in trails#10830 from `vendor/rails/v8.0.5.2/railties/test/application/zeitwerk_integration_test.rb`) never ran in CI before trails#10824, because the trailties globalSetup deadlock made the shards run zero tests. Its first local runs fail 3 to 6 of 19 tests, and the failing set changes from run to run:

- Most failures come from the isolated child (`activesupport/lib/testing/isolation.ts` `runInIsolation`) exiting with no output. That surfaces as `ArgumentError: marshal data too short` (`load`, isolation.ts:56) or as `SubprocessCrashed ... output: ""`. A child that ran a test file whose first ruby-compat import was a subpath crashed in `rbDefineClass("BasicObject")` with `TopLevel` undefined. Moving that file's imports to the barrel reduced the crashes but did not stop them.
- "reloading clears autoloaded tracked classes" (Rails `:320-341`): `Dependencies._autoloadedTrackedClasses` holds 25 classes where Rails asserts `Set[Child, Grandchild]`.
- "the once autoloader can autoload from initializers": `uninitialized constant Y` from `config/initializers/autoload-y.ts`.

## Acceptance criteria

- Capture the isolated child's stderr and fix the cause of its silent exit, so every isolated test in the file reports a result.
- `_autoloadedTrackedClasses` tracks only autoloaded classes, as `ActiveSupport::Dependencies` does (Rails `:334`).
- The once autoloader resolves `Y` from an initializer, as Rails' test does.
- The file passes 10 consecutive local runs.
