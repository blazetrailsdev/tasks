---
title: "Report a TS void return where the Rails body returns a value callers use"
status: draft
updated: 2026-09-20
rfc: "0000-parity-beyond-name-presence"
cluster: "comparers"
packages: []
deps: []
deps-rfc: []
est-loc: 240
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Four 0155 stories are a discarded return value:

- `establish-connection-returns-void-not-pool`: Rails returns the pool (`vendor/rails/activerecord/lib/active_record/connection_handling.rb:50-54`); `establishConnection` is `Promise<void>` (`connection-handling.ts:538-559`).
- `activesupport-assert-not-returns-void-where-rails-returns-true` (`testing/assertions.rb:20-23`, `testing/assertions.ts:114-117`).
- `assert-queries-count-discards-block-result` (`testing/query_assertions.rb:20-31`, `testing/query-assertions.ts:44`).
- `attribute-from-database-forgetting-assignment-returns-self`.

Nothing in the `parity:api:*` family looks at a return. The honest difficulty: every Ruby method returns something, so "Ruby returns a value" is true of nearly all of them and most of those values are incidental. The signal has to be narrower than that, and it has to be measured before it gates.

## Acceptance criteria

- A report lists matched pairs where the TS return type is `void` / `Promise<void>` and the Ruby body's final expression is a call, a constructor, or an explicit `return <expr>`, excluding setters, `initialize` and bang-less mutators whose last statement is an assignment.
- The four stories' methods appear in it.
- A reproducible sample of at least 80 rows is hand-audited with per-row verdicts in the PR body, as RFC 0113's noise-floor measurement did.
- Report-only. The PR ends with a recommendation to gate, to narrow, or to stop, backed by the measured rate.
