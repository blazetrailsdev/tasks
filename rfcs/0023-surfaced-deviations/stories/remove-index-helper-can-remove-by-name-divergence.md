---
title: "indexNameForRemoveFrom inline can_remove_index_by_name check ignores :algorithm and uses column==null vs Rails except(:name,:algorithm)"
status: ready
updated: 2026-06-14
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 25
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Surfaced while fixing `removeindex-expression-name-hashing` (PR #3223).

The module-level `indexNameForRemoveFrom` helper (shared by the SQLite and
PostgreSQL `removeIndex` overrides,
`packages/activerecord/src/connection-adapters/abstract/schema-statements.ts`)
short-circuits with an inline check:

```ts
if (columnName == null && options.name != null && options.column == null) {
  return options.name;
}
```

This diverges from Rails `can_remove_index_by_name?`
(`schema_statements.rb:1830`): `column_name.nil? && options.key?(:name) &&
options.except(:name, :algorithm).empty?`. The inline version (a) does not
tolerate an `:algorithm` key (Rails does) and (b) checks `column == null`
instead of "no keys other than name/algorithm", so e.g. `{ name, unique }`
takes the early path here but not in Rails. The same inline check is duplicated
at the SQLite/PG callsites (`canRemoveByName`). The abstract-class
`indexNameForRemove` was already migrated to delegate to `canRemoveIndexByName`
in PR #3223; the helper path was left as-is to keep that PR scoped.

## Acceptance criteria

- `indexNameForRemoveFrom` / `indexExistsForRemoveFrom` and the SQLite/PG
  `removeIndex` callsites resolve the early-return via the Rails-faithful
  `canRemoveIndexByName` logic (tolerate `:algorithm`, reject other extra keys).
- Test names match Rails verbatim.
