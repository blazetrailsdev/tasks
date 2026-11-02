---
title: "Port Zeitwerk callbacks, top-level, utf8 and logging tests"
status: ready
updated: 2026-11-02
rfc: "0213-zeitwerk-build-time-autoloader"
cluster: zw-gem
packages: ["zeitwerk"]
deps: []
deps-rfc: []
est-loc: 500
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Split from `zeitwerk-gem-loader-and-large-test-files`. Port these from `vendor/zeitwerk/v2.7.2/test/lib/zeitwerk/`: `test_callbacks.rb` (6 tests), `test_top_level.rb` (7), `test_utf8.rb` (5), `test_logging.rb` (20). A temp file reaches the loader through a `globalThis.$Loader` seat; `$get` is on `test-helpers/loader-test.ts`. Use `get(Object, ...)`, not `TopLevel`.

## Acceptance criteria

- `parity:test` for `zeitwerk` matches these files; a Ruby-only arm is a `PERMANENT-SKIP:` citing the deviation section.
