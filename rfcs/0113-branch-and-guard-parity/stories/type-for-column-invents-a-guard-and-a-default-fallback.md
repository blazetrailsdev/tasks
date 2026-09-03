---
title: "type_for_column invents a respond_to guard and a default-type fallback Rails has neither of"
status: draft
updated: 2026-09-03
rfc: "0113-branch-and-guard-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced while dropping the invented `:value` type registration in PR #7427
(`type-registries-register-nonexistent-value-type-name`). Routing the three
internal fallbacks onto `Type.defaultValue()` made each one legible, and two of
the three turn out to be fallbacks Rails does not have at all.

`ActiveRecord::ModelSchema#type_for_column`
(`vendor/rails/activerecord/lib/active_record/model_schema.rb:622-628`) is:

```ruby
def type_for_column(connection, column)
  type = connection.lookup_cast_type_from_column(column)

  if immutable_strings_by_default && type.respond_to?(:to_immutable_string)
    type = type.to_immutable_string
  end

  type
end
```

`connection.lookup_cast_type_from_column(column)` is called unconditionally and
its result is used unconditionally — a connection that cannot answer it is a
`NoMethodError`, not a silent default.

`packages/activerecord/src/attributes.ts`'s `typeForColumn` instead guards the
call with a `typeof lookupCastTypeFromColumn === "function"` check and falls
back to a default type:

```ts
let type =
  (typeof lookupCastTypeFromColumn === "function"
    ? lookupCastTypeFromColumn.call(connection, column)
    : null) ?? typeDefaultValue();
```

Two invented arms in one expression: the `typeof` guard, and the `??` fallback.
Both exist to keep duck-typed test connections working, and both convert a
programming error into a silently wrong column type in production code.

## Converged shape

Call `connection.lookupCastTypeFromColumn(column)` directly, as
`model_schema.rb:623` does, and let a connection that does not answer it raise.
Where a test stubs a connection, give the stub the method rather than teaching
the production body to tolerate its absence.

Note the `respond_to?(:to_immutable_string)` check on the NEXT line IS Rails' —
keep it; only the two arms above are invented.

## Acceptance criteria

- [ ] `typeForColumn` calls `lookupCastTypeFromColumn` unconditionally and uses
      its result unconditionally, mirroring `model_schema.rb:622-628`.
- [ ] The `typeof` guard and the `?? typeDefaultValue()` fallback are both gone.
- [ ] Any test connection that relied on the fallback answers the method instead.
- [ ] `parity:api:calls` / `:args` deltas non-negative; no new baseline row.
