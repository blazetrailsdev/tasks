---
title: "in_order_of still wraps adapter_class.column_name_with_order_matcher in a try/catch fallback"
status: done
updated: 2026-08-11
rfc: "0099-call-argument-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: 6371
claim: "2026-08-11T17:56:00Z"
assignee: "converge-relation-where-clause-writer"
blocked-by: null
closed-reason: null
---

## Context

Second half of `converge-preprocess-order-args-permit-matcher` (PR #6368), which
converged the `preprocess_order_args` call site only.

Rails `in_order_of` (`activerecord/lib/active_record/relation/query_methods.rb:718`):

```ruby
def in_order_of(column, values, filter: true)
  model.disallow_raw_sql!([column], permit: model.adapter_class.column_name_with_order_matcher)
```

trails (`packages/activerecord/src/relation.ts:1147-1157`) still wraps the
lookup in a try/catch with a fallback:

```ts
let orderMatcher: RegExp | undefined;
try {
  orderMatcher = resolveColumnNameWithOrderMatcher(this._conn());
} catch {
  orderMatcher = abstractColumnNameWithOrderMatcher();
}
disallowRawSqlBang([column], { permit: orderMatcher });
```

Two divergences from Rails in one body: the hoisted local plus swallowed raise,
and `this._conn()` where Rails reads `model.adapter_class` — a class-level
lookup that leases no connection. PR #6368 established that
`adapterClassSync()` is the non-leasing lookup and that dropping the fallback
is safe (Rails' `connection_pool` resolves `strict: true`, so `adapter_class`
raises for a model with no established connection and trails should too).

## Converged shape

```ts
disallowRawSqlBang([column], {
  permit: (
    this.model.adapterClassSync() as unknown as { columnNameWithOrderMatcher(): RegExp }
  ).columnNameWithOrderMatcher(),
});
```

matching `preprocessOrderArgs` in `relation/query-methods.ts` as landed by
PR #6368.

## Acceptance criteria

- [ ] `in_order_of` passes `model.adapter_class.column_name_with_order_matcher`
      inline, cited to `query_methods.rb:718`.
- [ ] `resolveColumnNameWithOrderMatcher` / `abstractColumnNameWithOrderMatcher`
      are deleted from this call site, or the fallback is justified at the call
      site with the specific condition that needs it.
- [ ] `pnpm parity:api:calls` / `pnpm parity:api:calls:args` green, no new rows.
