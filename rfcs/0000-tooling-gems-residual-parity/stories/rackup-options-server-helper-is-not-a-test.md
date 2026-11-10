---
title: "parity:test stops counting rackup's test_options_server helper as a test"
status: draft
updated: 2026-11-09
rfc: "0000-tooling-gems-residual-parity"
cluster: null
packages:
  - "rackup"
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:test` rackup 63/64 (8 skipped, all `PERMANENT-SKIP`); the one miss,
"options server", is `def test_options_server(*args)`
(`vendor/rackup/v2.2.1/test/spec_server.rb:243`), a helper the examples call at
:264-290, not a test. The Ruby extractor counts every `def test_*`.

## Acceptance criteria

- [ ] The Ruby test extractor skips a `def test_*` that takes parameters when the
      file calls it as a helper, with a fixture test in `scripts/test-compare/`
      that fails on the current code.
- [ ] `pnpm parity:test --package rackup` reports 63/63.
