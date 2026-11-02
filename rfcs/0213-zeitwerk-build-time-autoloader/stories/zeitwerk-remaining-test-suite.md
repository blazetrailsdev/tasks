---
title: "Port the rest of Zeitwerk's test suite"
status: in-progress
updated: 2026-11-02
rfc: "0213-zeitwerk-build-time-autoloader"
cluster: zw-gem
packages: ["zeitwerk"]
deps: ["zeitwerk-reload-and-unload"]
deps-rfc: []
est-loc: 700
priority: null
pr: trails#9620
claim: "2026-11-02T13:26:40Z"
assignee: "zeitwerk-remaining-test-suite"
blocked-by: null
closed-reason: null
---

## Context

About 443 tests in `vendor/zeitwerk/v2.7.2/test/`. RFC 0213 § "Verification".

## Acceptance criteria

- `parity:test` for `zeitwerk` matches every portable test.
- Ruby-only arms (`test_require_interaction.rb`, parts of `test_ruby_compatibility.rb`) are parked under `PERMANENT-SKIP:` citing the deviation section.
- `parity:api` matches all of `lib/zeitwerk/` apart from scoped skips.
