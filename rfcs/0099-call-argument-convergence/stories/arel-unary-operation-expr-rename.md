---
title: "arel-unary-operation-expr-rename"
status: done
updated: 2026-08-11
rfc: "0099-call-argument-convergence"
cluster: null
packages: []
deps: []
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
`UnaryOperation.operand` (`packages/arel/src/nodes/unary-operation.ts:19`)
shadows Rails' `Unary#expr` (`vendor/rails/activerecord/lib/arel/nodes/unary.rb:6`),
from which `UnaryOperation` inherits. The field name is Rails', translated by
docs/ruby-ts-conventions.md, so `expr` is the only faithful spelling and the
rename is free fidelity.

## Acceptance criteria

1. The field is `expr`, inherited from `Unary` exactly as Rails does — no
   `operand` alias, getter or setter retained.
2. Every reader/writer across `packages/arel/` (and any activerecord caller)
   updated.
3. Any converged `kind: "args"` baseline row deleted from its shard
   (only-shrink), and `pnpm parity:api`, `pnpm parity:api:calls:args` green.
