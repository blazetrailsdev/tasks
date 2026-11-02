---
title: "Port Zeitwerk eager_load_namespace tests"
status: ready
updated: 2026-11-02
rfc: "0213-zeitwerk-build-time-autoloader"
cluster: zw-gem
packages: ["zeitwerk"]
deps: []
deps-rfc: []
est-loc: 450
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Split from `zeitwerk-gem-loader-and-large-test-files`. Port `test_eager_load_namespace.rb` (36 tests) from `vendor/zeitwerk/v2.7.2/test/lib/zeitwerk/`. Helpers as in `zeitwerk-remaining-test-suite`: `withFiles`, `$get`, `get(Object, ...)`.

## Acceptance criteria

- `parity:test` for `zeitwerk` matches the file; a Ruby-only arm is a `PERMANENT-SKIP:` citing the deviation section.
