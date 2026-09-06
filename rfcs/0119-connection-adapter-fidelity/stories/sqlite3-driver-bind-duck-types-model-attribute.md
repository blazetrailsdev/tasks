---
title: "sqlite3 _driverBind duck-types ModelAttribute where Rails type-checks it"
status: ready
updated: 2026-09-06
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: []
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

`_driverBind` (`packages/activerecord/src/connection-adapters/sqlite3-adapter.ts:123-131`)
detects an attribute bind by duck-typing:

```ts
if (value && typeof value === "object" && "valueForDatabase" in value) {
```

Rails uses a type check, not a shape check
(`activerecord/lib/active_record/connection_adapters/abstract/quoting.rb:224-232`):

```ruby
def type_casted_binds(binds)
  binds&.map do |value|
    if ActiveModel::Attribute === value
      type_cast(value.value_for_database)
    else
      type_cast(value)
    end
  end
end
```

trails' own abstract `typeCastedBinds`
(`packages/activerecord/src/connection-adapters/abstract/quoting.ts:301-311`)
already ports this faithfully as `value instanceof ModelAttribute`, so
`_driverBind` is the odd one out — the only bind path in the repo that decides
on shape rather than type.

This became load-bearing in PR #7522, which made `_driverBind` the body of
sqlite3's `typeCastedBinds` override. It is now the _sole_ bind path for the
sqlite3 adapter, where before it only served the adapter-local `rawExecute`
override. Any plain object that happens to carry a `valueForDatabase` key is
now unwrapped as if it were an `ActiveModel::Attribute` — including a JSON
column value or a test double, which is precisely the failure mode recorded for
duck-typed widening elsewhere in this repo.

## Converged shape

- `_driverBind` narrows to `value instanceof ModelAttribute`, matching
  `abstract/quoting.ts:305` and Rails' `ActiveModel::Attribute === value`.
- Verify no caller depends on the looser check — in particular the sqlite3
  bind-parameter and JSON suites, which are the ones that would exercise an
  object bind carrying that key.

## Acceptance criteria

- `_driverBind` uses an `instanceof ModelAttribute` check, not `"valueForDatabase" in value`.
- The float-bind behaviour PR #7522 preserved (`bindsAsFloat` from
  `attr.type instanceof FloatType`) still holds — pinned by
  `sqlite3-adapter.integer-bind.trails.test.ts`.
- sqlite3 adapter suites stay green.
