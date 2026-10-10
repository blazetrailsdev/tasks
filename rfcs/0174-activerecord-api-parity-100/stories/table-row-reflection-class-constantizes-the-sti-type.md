---
title: "activerecord: TableRow#reflection_class constantizes the row's type (rescue model_class), not find_sti_class"
status: ready
updated: 2026-10-10
rfc: "0174-activerecord-api-parity-100"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced while converging `find_sti_class` (trails#8336).

`vendor/rails/v8.0.2/activerecord/lib/active_record/fixture_set/table_row.rb:95-101`:

```ruby
def reflection_class
  @reflection_class ||= if @row.include?(model_metadata.inheritance_column_name)
    @row[model_metadata.inheritance_column_name].constantize rescue model_class
  else
    model_class
  end
end
```

`packages/activerecord/src/fixture-set/table-row.ts:119-131` instead calls
`this.modelClass!.findStiClass(String(this._row[inheritanceColumnName]))` inside a bare `try` / `catch`.
`find_sti_class` (`inheritance.rb:311-320`) is not what Rails calls here: it casts through the
inheritance column's type, resolves through `sti_class_for` (so `store_full_sti_class` /
`compute_type` apply) and raises `SubclassNotFound` for a constant outside the model's descendants,
where Rails' `constantize` answers any constant of that name. The port also adds a
`inheritanceColumnName != null` guard and a `String(...)` coercion Rails does not have.

## Acceptance criteria

- [ ] `reflectionClass` is `constantize(this._row[inheritanceColumnName])` with Rails' `rescue model_class` (a `StandardError` rescue), not `findStiClass`.
- [ ] The invented `!= null` guard and `String()` coercion are gone, or each is shown to be language-forced at the call site.
- [ ] `pnpm parity:api:calls && pnpm parity:api:calls:args` green; fixture tests green on all adapters.

## Verification

```bash
pnpm parity:api:calls && pnpm vitest run packages/activerecord/src/fixtures.test.ts packages/activerecord/src/test-fixtures.test.ts
```
