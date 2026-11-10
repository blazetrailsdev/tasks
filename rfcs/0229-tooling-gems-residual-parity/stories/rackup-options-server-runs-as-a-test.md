---
title: "Port rackup's test_options_server as the test Minitest runs it as"
status: draft
updated: 2026-11-09
rfc: "0229-tooling-gems-residual-parity"
cluster: null
packages:
  - "rackup"
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:test` rackup 63/64 (8 skipped, all `PERMANENT-SKIP`). The one miss,
"options server", is `def test_options_server(*args)`
(`vendor/rackup/v2.2.1/test/spec_server.rb:243-262`). The examples at :264-290
call it as a helper, but it also sits inside the spec's `describe` and needs no
arguments, so Minitest runs it once with no arguments as a test with no
assertions. The extractor is right to count it.

## Acceptance criteria

- [ ] The helper is ported, and an `it("options server")` calls it with no
      arguments, as Minitest does.
- [ ] `pnpm parity:test --package rackup` reports 64/64.
