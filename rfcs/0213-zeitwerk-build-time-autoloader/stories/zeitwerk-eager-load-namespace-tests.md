---
title: "Port Zeitwerk eager_load_namespace tests"
status: claimed
updated: 2026-11-03
rfc: "0213-zeitwerk-build-time-autoloader"
cluster: zw-gem
packages: ["zeitwerk"]
deps: []
deps-rfc: []
est-loc: 450
priority: null
pr: null
claim: "2026-11-03T02:56:40Z"
assignee: "zeitwerk-eager-load-namespace-tests"
blocked-by: null
closed-reason: null
---

## Context

Split from `zeitwerk-gem-loader-and-large-test-files`. Port `test_eager_load_namespace.rb` (36 tests) from `vendor/zeitwerk/v2.7.2/test/lib/zeitwerk/`. Helpers as in `zeitwerk-remaining-test-suite`: `withFiles`, `$get`, `get(Object, ...)`.

## Acceptance criteria

- `parity:test` for `zeitwerk` matches the file; a Ruby-only arm is a `PERMANENT-SKIP:` citing the deviation section.
