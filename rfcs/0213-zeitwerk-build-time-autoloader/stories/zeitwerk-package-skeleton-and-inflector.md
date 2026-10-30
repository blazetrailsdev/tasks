---
title: "@blazetrails/zeitwerk package skeleton, inflectors and errors"
status: draft
updated: 2026-10-30
rfc: "0213-zeitwerk-build-time-autoloader"
cluster: zw-gem
packages: ["zeitwerk"]
deps: ["vendor-zeitwerk-v2-7-2"]
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

RFC 0213 § "`@blazetrails/zeitwerk`". Sources: `vendor/zeitwerk/v2.7.2/lib/zeitwerk/inflector.rb`, `gem_inflector.rb`, `null_inflector.rb`, `error.rb`.

## Acceptance criteria

- The package is registered everywhere a new package must be, and enrolled in `parity:api` and `parity:test`.
- `Inflector`, `GemInflector`, `NullInflector` and every error class port line for line, with Zeitwerk's messages.
- `Zeitwerk::NameError` extends ruby-compat's `NameError`.
- Zeitwerk's inflector tests are ported.
