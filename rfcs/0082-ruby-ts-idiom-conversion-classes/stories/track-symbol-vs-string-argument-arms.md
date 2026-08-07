---
title: "Track: symbol vs string argument arms"
status: ready
updated: 2026-07-27
rfc: "0082-ruby-ts-idiom-conversion-classes"
cluster: null
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

# Track: symbol vs string argument arms

## Context

Ruby `Symbol` arguments become plain strings in trails, but Rails APIs often
branch per arm (`Symbol` vs `String` vs `Proc`) with different behavior.
Example: `order(:name)` qualifies the column while `order("name")` stays bare —
`packages/activerecord/src/relation/query-methods.ts:645` (converged rule), vs
Rails `vendor/rails/activerecord/lib/active_record/relation/query_methods.rb`.
Dropping a former-Symbol arm silently changes SQL or callback dispatch — this
class is semantic, not cosmetic.

Existing scattered stories (reference, do not re-home): open —
`audit-model-and-test-order-arg-symbol-vs-string` (0023, draft),
`collection-callback-symbol-arm-coverage` (0023, draft),
`compare-normalize-symbol-row-column-keys` (0064, ready). Done precedent —
`hwia-symbol-key-normalization`, `habtm-collection-first-null-for-symbol-keys`,
`nested-attr-reject-if-all-blank-symbol-form`,
`port-merge-joins-as-symbols-relation-test`,
`abstract-quote-string-symbol-branch-order`.

## Acceptance criteria

- Audit of vendored Rails call sites that branch on `Symbol` (grep `is_a?(Symbol)`,
  `Symbol ===`, `to_sym` arms in `vendor/rails/activerecord/lib`), mapped to
  their trails counterparts with an arm-coverage verdict per site.
- Divergent sites fixed (case-by-case; each reads the Rails body first) or
  registered as child stories here.
- The three open draft stories above resolved or explicitly linked to a child.
