---
title: "addOptionsForIndexColumns duck-type-probes supports_index_sort_order? instead of calling it"
status: done
updated: 2026-08-09
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: 6300
claim: "2026-08-09T20:59:21Z"
assignee: "adapter-class-sync-swallows-the-pool-error-rails-raises"
blocked-by: null
closed-reason: null
---

## Context

`SchemaStatements#addOptionsForIndexColumns`
(`packages/activerecord/src/connection-adapters/abstract/schema-statements.ts:2038-2053`)
gates the sort-order arm on a duck-type probe:

```ts
const adapter = this as any;
if (typeof adapter.supportsIndexSortOrder === "function" && (await adapter.supportsIndexSortOrder())) {
```

Rails calls the predicate unconditionally —
`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/schema_statements.rb:1639-1645`:

```ruby
def add_options_for_index_columns(quoted_columns, **options)
  if supports_index_sort_order?
    quoted_columns = add_index_sort_order(quoted_columns, **options)
  end
  quoted_columns
end
```

`supports_index_sort_order?` is defined on `AbstractAdapter`
(`abstract_adapter.rb:411`, version-gated at `abstract_mysql_adapter.rb:409`),
so every adapter answers it and there is nothing to probe for. Surfaced in
PR #6282, which moved MySQL's `add_index_length` onto the adapter and left
this pre-existing guard untouched.

## Converged shape

`if (await this.supportsIndexSortOrder())`, with `supportsIndexSortOrder`
declared on the adapter surface (`abstract-adapter.ts`) rather than reached
through an `as any` cast. Check whether any caller still reaches the method on
a host that lacks the predicate — the mysql/pg unit-test shims construct
`Object.create(MysqlSchemaStatements.prototype)` and supply it, so the probe
may already be dead.

## Acceptance criteria

- [ ] `addOptionsForIndexColumns` calls `supportsIndexSortOrder()` unconditionally,
      matching `abstract/schema_statements.rb:1640`.
- [ ] No `as any` cast on `this` in the body.
- [ ] Index SQL with `order:` unchanged on every adapter.
