---
title: "arel-append-escape-inline-convergence"
status: done
updated: 2026-08-11
rfc: "0099-call-argument-convergence"
cluster: null
packages: []
deps:
  - arel-collector-argument-order-convergence
deps-rfc: []
est-loc: null
priority: null
pr: 6377
claim: "2026-08-11T20:50:30Z"
assignee: "arel-append-escape-inline-convergence"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by the RFC 0095 call-argument baseline seed (PR #6343).
`appendEscape` (`packages/arel/src/visitors/to-sql.ts:1044`) is an extracted
helper Rails does not have: Rails inlines the same work in
`vendor/rails/activerecord/lib/arel/visitors/to_sql.rb:485-495`. CLAUDE.md's
decomposition rule is one Rails method = one TS method — if Rails inlines it,
the port inlines it.

## Acceptance criteria

1. `appendEscape` is inlined at its call site(s), matching `to_sql.rb:485-495`
   line for line; the helper is deleted.
2. Any `kind: "args"` baseline row that converges as a result is deleted from
   the arel shard (only-shrink).
3. `pnpm parity:api:extra --package arel` no longer reports the helper, and
   `pnpm parity:api:calls:args` is green.
