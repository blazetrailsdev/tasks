---
title: "MySQL::Column carries an encode_with override mysql/column.rb does not define"
status: ready
updated: 2026-09-16
rfc: "0123-blocked-convergence-holding"
cluster: null
packages: []
deps: ["schema-cache-dump-restores-column-subclass-without-a-class-key"]
deps-rfc: []
est-loc: 20
priority: 3
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rescoped on 2026-09-16 against vendor/rails. The original premise, that all three
adapter Column subclasses carry coder overrides Rails lacks, was partly false:

- `vendor/rails/activerecord/lib/active_record/connection_adapters/postgresql/column.rb:50-62`
  defines `init_with`/`encode_with` for `serial`, `identity` and `generated`.
  `postgresql/column.ts:96-108` matches it.
- `sqlite3/column.rb:36-44` does the same for `auto_increment`, and
  `sqlite3/column.ts:80-88` matches it.
- `mysql/column.rb` defines neither method.

`packages/activerecord/src/connection-adapters/mysql/column.ts:30-34` still carries:

```ts
/** @noRailsEquivalent PERMANENT */
override encodeWith(coder: ColumnCoder): void {
  super.encodeWith(coder);
  coder["class"] = "MySQL::Column";
}
```

**This override exists only to write the `class` key.** `rehydrateColumn`
(`connection-adapters/schema-cache.ts:37-44`) dispatches on that key through
`COLUMN_CLASSES` (`:30-35`). If the override is deleted on its own, a
dump-loaded MySQL column rehydrates as a base `Column` and loses
`MySQL::Column`'s behaviour (`isAutoIncrement`, `isVirtual`). So the deletion
has to follow the `class`-key convergence, filed separately as
`schema-cache-dump-restores-column-subclass-without-a-class-key`.

## Acceptance criteria

- `mysql/column.ts` defines no `encodeWith`, matching `mysql/column.rb`, and its
  `@noRailsEquivalent PERMANENT` receipt is removed.
- `postgresql/column.ts` and `sqlite3/column.ts` keep their overrides, and each
  writes the keys its Ruby body writes. Their `class` key is the dependency
  story's to remove.
- A MySQL column round-tripped through a schema-cache dump is still a
  `MySQL::Column` (`packages/activerecord/src/support/schema-cache-dump.trails.test.ts`
  green on mysql2 and MariaDB).
