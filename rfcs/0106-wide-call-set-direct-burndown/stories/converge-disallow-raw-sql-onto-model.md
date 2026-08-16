---
title: "Move disallowRawSqlBang onto the model, as Rails' disallow_raw_sql! (calculations.rb:315)"
status: done
updated: 2026-08-16
rfc: "0106-wide-call-set-direct-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: 6601
claim: "2026-08-16T17:45:07Z"
assignee: "collection-proxy-delegate-query-method-bangs-to-scope"
blocked-by: null
closed-reason: null
---

## Context

Rails' `Calculations#pluck` guards its raw-SQL arguments through the model:

```ruby
model.disallow_raw_sql!(flattened_args(column_names))
```

(`vendor/rails/activerecord/lib/active_record/relation/calculations.rb:315`.)

`disallow_raw_sql!` is a model class method
(`vendor/rails/activerecord/lib/active_record/sanitization.rb`, the
`ClassMethods` module) that takes just the args and resolves the permit matcher
itself from `adapter_class.column_name_matcher`.

trails spells it as a free function taking the matcher explicitly, in
`packages/activerecord/src/relation/calculations.ts` (`pluck`):

```ts
disallowRawSqlBang(stringColumns, { permit: resolveColumnNameMatcher(this._conn()) });
```

with a trails-invented `resolveColumnNameMatcher` helper right below it in the
same file:

```ts
function resolveColumnNameMatcher(adapter: any): RegExp {
  return adapter?.constructor?.columnNameMatcher?.() ?? abstractColumnNameMatcher();
}
```

That helper exists only because trails has no `Model.adapter_class` seam, so
the resolution Rails does inside `disallow_raw_sql!` is hoisted to the call
site. The result is a call-argument divergence, baselined as a `kind: "args"`
row in
`scripts/api-compare/call-mismatches-exclude/activerecord/relation/calculations.json`:

```text
activerecord  relation/calculations.ts  pluck  disallow_raw_sql!(ref:model, ref:flattenedArgs)
```

This predates PR #6597 — the same call lived in `relation.ts`'s `_pluckInner`
— and only became gate-visible when `pluck` moved to `calculations.ts` and
`_pluckInner` was folded back in. It is debt, not permission.

There is a second call site with the same shape in `relation.ts` (the
order/`unsafe_raw_sql` guard), which should converge with it.

## Acceptance criteria

- [ ] `disallowRawSqlBang` is reachable as a model class method mirroring
      Rails' `Model.disallow_raw_sql!(args)`, resolving its own permit matcher
      from the model's adapter class rather than taking one from the caller.
- [ ] `pluck` calls it as `this.model.disallowRawSqlBang(this.flattenedArgs(columns))`,
      matching `calculations.rb:315` argument-for-argument.
- [ ] `resolveColumnNameMatcher` in `relation/calculations.ts` is deleted — the
      resolution moves inside the model method, where Rails has it.
- [ ] The `pluck disallow_raw_sql!(...)` args row is DELETED from
      `call-mismatches-exclude/activerecord/relation/calculations.json`
      (only-shrink; delete by hand, do not reseed) and the shard's mark is
      tightened.
- [ ] `pnpm parity:api:calls:args` green with no new rows;
      `pnpm parity:api:extra --package activerecord` shows no growth (the
      deleted helper should reduce `relation/calculations.ts`'s novel count or
      leave it flat).
