---
title: "zeitwerk-multiple-loaders-tests"
status: done
updated: 2026-11-02
rfc: "0213-zeitwerk-build-time-autoloader"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#9637
claim: "2026-11-02T18:46:45Z"
assignee: "zeitwerk-multiple-loaders-tests"
blocked-by: null
closed-reason: null
---

## Context

`vendor/zeitwerk/v2.7.2/test/lib/zeitwerk/test_multiple_loaders.rb` (2 tests) was dropped from trails#9620 for the LOC ceiling. A fixture file references another constant with `await globalThis.$get("App1")`; `$get` is set in `withFiles`.

## Acceptance criteria

- `parity:test` for `zeitwerk` matches `test_multiple_loaders.rb`, with assertion kinds equal to Rails' (`assert` is `toBeTruthy`).
