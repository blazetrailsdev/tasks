---
title: "port-disconnected-test"
status: in-progress
updated: 2026-07-23
rfc: "0030-ar-test-compare-residual-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: 1
pr: 5119
claim: "2026-07-23T02:34:36Z"
assignee: "port-disconnected-test"
blocked-by: null
closed-reason: null
---

## Context

`test:compare --package activerecord --incomplete` marks
`disconnected_test.rb` ✗ — no TS counterpart exists
(`packages/activerecord/src/disconnected.test.ts` is absent). Rails source:
`vendor/rails/activerecord/test/cases/disconnected_test.rb:18` — a single test,
"reconnects to execute statements when disconnected": execute a statement,
`disconnect!` (raw connection becomes nil), execute again and assert a NEW raw
connection was established. Gated `unless in_memory_db?`. No threads involved —
directly portable against the adapter's `disconnect!` / lazy-reconnect path
(`connection-adapters/abstract-adapter.ts`).

## Acceptance criteria

- `packages/activerecord/src/disconnected.test.ts` exists with the test
  "reconnects to execute statements when disconnected" matching Rails' name,
  asserting raw-connection identity changes across `disconnect!` + re-execute.
- Rails' `in_memory_db?` gate mirrored (skip under sqlite3 :memory:).
- `test:compare --package activerecord` no longer lists the file as ✗.
