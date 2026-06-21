---
title: "dup should set duped attributes before after_initialize fires (Rails Core#initialize_dup order)"
status: claimed
updated: 2026-06-21
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: "2026-06-21T12:54:42Z"
assignee: "dup-sets-attributes-before-after-initialize"
blocked-by: null
---

## Context

Surfaced in PR #3780 (new-record-dirty-against-defaults-on-construct-and-dup).

Rails `ActiveRecord::Core#initialize_dup` (vendor/rails/activerecord/lib/active_record/core.rb:550-552)
sets `@attributes = init_attributes(other)` BEFORE `_run_initialize_callbacks`,
so an `after_initialize` hook on a dup observes the full duped attribute set.

trails `Persistence#dup` (packages/activerecord/src/persistence.ts) constructs the
copy via `new ctor({})` — which runs the constructor and fires `after_initialize`
against an EMPTY attribute bag — and only swaps the duped `_attributes` in
afterward. So a model whose `after_initialize` reads attributes sees `{}` on a
dup, diverging from Rails. This is pre-existing (the old `assignAttributes`-after
path had the same ordering) and is documented in the `dup` docstring as a known
ordering divergence.

## Acceptance criteria

- [ ] `dup` establishes the duped `_attributes` (deep_dup + reset pk, plus the
      persisted FromUser-over-default rebuild) BEFORE `after_initialize` fires,
      so an `after_initialize` hook reading attributes on a dup sees the duped
      values (Rails parity).
- [ ] Preserve current behavior: STI `ensure_proper_type`, default-scope
      attribute application, aggregations/locking/timestamp `initialize_dup`
      clearing, and the dirty-vs-defaults pass.
- [ ] Likely approach: suppress `after_initialize` during `new ctor({})` (via the
      existing `_suppressInitializeCallback` mechanism), swap attributes + run the
      initialize_dup chain + dirty pass, then dispatch `after_initialize` manually
      — re-threading the internals-callback steps the suppressed branch skips.
- [ ] No regressions in dup / persistence / inheritance (STI) / dirty suites.
