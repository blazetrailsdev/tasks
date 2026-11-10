---
title: 'Port zeitwerk''s two unreceipted skipped tests: "eager loads gems" and "on_load survives reloads"'
status: claimed
updated: 2026-11-10
rfc: "0229-tooling-gems-residual-parity"
cluster: null
packages:
  - "zeitwerk"
deps: []
deps-rfc: []
est-loc: 250
priority: 2
pr: null
claim: "2026-11-10T13:44:28Z"
assignee: "rake-guarded-tests-and-thread-history-path"
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:test` zeitwerk 418/418 matched, 38 skipped; 36 carry
`PERMANENT-SKIP`. Two are bare `it.skip` with no receipt:
`packages/zeitwerk/test/eager-load.test.ts:95` "eager loads gems" and
`packages/zeitwerk/test/on-load.test.ts:151` "on_load survives reloads"
(Ruby: `vendor/zeitwerk/v2.7.2/test/lib/zeitwerk/test_eager_load.rb`,
`test_on_load.rb`).

## Acceptance criteria

- [ ] Both tests run with the Ruby bodies, or each is `PERMANENT-SKIP` with a
      cited CLAUDE.md section.
