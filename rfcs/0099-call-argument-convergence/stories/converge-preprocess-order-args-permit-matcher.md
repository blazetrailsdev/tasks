---
title: "disallow_raw_sql! permit: passes adapter_class.column_name_with_order_matcher inline"
status: done
updated: 2026-08-11
rfc: "0099-call-argument-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: 6368
claim: "2026-08-11T16:13:43Z"
assignee: "naming-burndown-ar-field-and-body-restructures"
blocked-by: null
closed-reason: null
---

## Context

Residual `naming` (report-only) row left by PR #6360, which converged the
`permit:` kwarg itself on `disallow_raw_sql!`.

Rails `preprocess_order_args`
(`activerecord/lib/active_record/relation/query_methods.rb:2081-2085`):

```ruby
model.disallow_raw_sql!(
  flattened_args(order_args),
  permit: model.adapter_class.column_name_with_order_matcher
)
```

trails (`relation/query-methods.ts`, `preprocessOrderArgs`) passes
`resolveOrderMatcher(this.model)` — a file-local helper that wraps
`model.adapterClassSync()?.columnNameWithOrderMatcher()` in a try/catch with an
`abstractOrderMatcher()` fallback. The wrapper exists because reading the
deprecated `.connection` getter would permanently check out a connection under
`permanent_connection_checkout = :deprecated|:disallowed`; see
`resolveOrderMatcher`'s own comment and
`project_rfc0073_permanent_connection_checkout_flip`.

The same helper is used at `in_order_of` (`query_methods.rb:718`), which passes
the identical expression in Rails.

## Converged shape

If `adapterClassSync()` can be made total — always returning an adapter class
without a connection checkout — the call sites can spell
`this.model.adapterClass.columnNameWithOrderMatcher()` inline as Rails does and
`resolveOrderMatcher` disappears. Track alongside the
`permanent_connection_checkout` flip.

## Acceptance criteria

1. Both `disallow_raw_sql!` call sites pass
   `model.adapter_class.column_name_with_order_matcher` inline, cited to
   `relation/query_methods.rb:718, 2082-2085`.
2. `resolveOrderMatcher` and `abstractOrderMatcher` are deleted, or the fallback
   is justified at the call site with the specific checkout mode that needs it.
3. `pnpm parity:api:calls:args:report` shows the `preprocess_order_args` naming
   row gone; `pnpm parity:api:calls:args` stays green.
