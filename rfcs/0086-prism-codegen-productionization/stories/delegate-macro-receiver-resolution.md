---
title: "delegate-macro-receiver-resolution"
status: draft
updated: 2026-07-31
rfc: "0086-prism-codegen-productionization"
cluster: null
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

PR #5727's conformance scorer (`pnpm codegen:score`, baseline 10.7%) shows the
dominant remaining generator-side divergence is Rails `delegate` macros:
`Relation#order_values` etc. delegate to `model` via
`vendor/rails/activerecord/lib/active_record/relation/delegation.rb` and
inline `delegate :x, to: :y` calls, which the generator renders as the
Rails-faithful `this.orderValues` while the port writes
`this.model.orderValues`. The macro calls are statically parseable
(receiverless `CallNode` name `delegate` with symbol args + `to:` keyword),
so a pre-pass can build a per-file delegation table and the self-call
resolution in `scripts/prism-codegen/handlers/expressions.ts` (`emitCall`,
`selfCall` branch) can consult it to emit `this.<to>.<method>` instead of
`this.<method>`.

## Acceptance criteria

- A delegation table is extracted from each target file's `delegate` macro
  calls (and `relation/delegation.rb` for the Relation family).
- Self-call resolution emits `this.<target>.<method>` for delegated names.
- `pnpm codegen:score` matched count increases; scorer tests cover a
  delegated call fixture.
- No parse errors; coverage accounting stays single-count.
