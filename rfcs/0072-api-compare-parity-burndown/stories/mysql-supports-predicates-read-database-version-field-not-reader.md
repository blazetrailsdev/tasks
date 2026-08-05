---
title: "MySQL supports_* predicates read the _databaseVersion field, not Rails' database_version reader"
status: done
updated: 2026-08-05
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 6125
claim: "2026-08-05T12:29:59Z"
assignee: "retire-non-transactional-ratchet-non-wrappable-classes"
blocked-by: null
closed-reason: null
---

## Context

Surfaced while retiring the `_mariadb` / `_fullVersionString` memo fields in PR #6115
(RFC 0072 `retire-mysql-full-version-and-mariadb-memo-fields`). That PR
converged `mariadb?` onto the `full_version` delegation; the sibling version
predicates in the same file were left as they were and are the remaining half.

Rails' MySQL capability predicates all read the `database_version` READER, e.g.
`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract_mysql_adapter.rb:96-98`:

```ruby
def supports_index_sort_order?
  !mariadb? && database_version >= "8.0.1"
end
```

`database_version` is `AbstractAdapter#database_version`
(`abstract_adapter.rb:854-856`), which returns `pool.server_version(self)`.

trails instead reaches past the reader into the backing field, in ~13 sites in
`packages/activerecord/src/connection-adapters/abstract-mysql-adapter.ts`
(supportsIndexSortOrder, supportsExpressionIndex, supportsCheckConstraints,
supportsOptimizerHints, supportsCommonTableExpressions, supportsInsertReturning,
supportsJson, supportsInsertRawAliasSyntax, supportsRenameIndex,
supportsRenameColumn, analyzeWithoutExplain, checkVersion, and
getDatabaseVersion's own guard):

```ts
if (this.isMariadb()) return (this._databaseVersion?.compare("10.8.1") ?? -1) >= 0;
return (this._databaseVersion?.compare("8.0.1") ?? -1) >= 0;
```

Two divergences in one line. The field read bypasses the Rails reader, and the
`?? -1` swallows the unwarmed case as "older than everything" where Rails would
raise — a silent wrong answer rather than a loud one, and the reason the sync
`databaseVersion` getter's explicit throw is never reached from these paths.

## Converged shape

- Each predicate reads `this.databaseVersion` (the Rails-named sync getter,
  already present at `abstract-mysql-adapter.ts`) rather than
  `this._databaseVersion`.
- Drop the `?? -1` fallbacks; let the getter's existing "await
  getDatabaseVersion() first" error surface, matching Rails' behaviour of
  simply not being callable before the version is known.
- Keep the branch order and the version literals exactly as Rails has them.

Depends on nothing; independent of
`port-pool-server-version-retire-get-database-version-memo-guard`, though
landing that one first makes the reader cheap.

## Acceptance criteria

- [ ] No `_databaseVersion` read outside `getDatabaseVersion` and the
      `databaseVersion` getter.
- [ ] No `?? -1` version-compare fallbacks remain in the file.
- [ ] Branch order and version literals unchanged vs abstract_mysql_adapter.rb.
- [ ] MySQL/MariaDB lanes green.
