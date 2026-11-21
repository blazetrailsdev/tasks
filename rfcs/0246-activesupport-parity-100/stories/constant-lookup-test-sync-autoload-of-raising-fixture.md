---
title: "constant-lookup-test-sync-autoload-of-raising-fixture"
status: in-progress
updated: 2026-11-20
rfc: "0246-activesupport-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#10458
claim: "2026-11-20T22:47:06Z"
assignee: "activesupport-api-misses-remainder-after-bundle"
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/activesupport/test/testing/constant_lookup_test.rb:61` "does not shallow ordinary exceptions" stays `it.skip` in `packages/activesupport/test/testing/constant-lookup.test.ts`. It needs `Object.autoload` of `autoloading_fixtures/raises_no_method_error.rb` to fire inside the synchronous `safe_constantize` reached by `determine_constant_from_test_name`; ruby-compat's `rbAutoloadLoad` is async.

## Acceptance criteria

- The test runs (e.g. the fixture is loaded by an awaited step before the lookup, as packages/zeitwerk/CLAUDE.md "Module#autoload is a build step" does), or the operator rules it permanent and it is parked with that receipt.
