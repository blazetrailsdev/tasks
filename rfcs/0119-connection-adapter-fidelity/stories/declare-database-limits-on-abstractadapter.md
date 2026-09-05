---
title: "Declare the DatabaseLimits methods on AbstractAdapter instead of casting at call sites"
status: ready
updated: 2026-09-05
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 70
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `ActiveRecord::ConnectionAdapters::DatabaseLimits`
(`activerecord/lib/active_record/connection_adapters/abstract/database_limits.rb:5-33`)
gives every adapter five ordinary public methods: `max_identifier_length`,
`table_name_length`, `table_alias_length`, `index_name_length` and
`bind_params_length`. A Rails test calls them straight off the connection —
`connection.index_name_length` (`test/cases/migration/index_test.rb:56`),
`connection.table_name_length` (`test/cases/migration/rename_table_test.rb`).

trails ports them in
`packages/activerecord/src/connection-adapters/abstract/database-limits.ts:5-24`
and mixes them onto the adapter at
`connection-adapters/abstract-adapter.ts:2141-2145`, but the `AbstractAdapter`
INTERFACE declares none of them. So the methods exist at runtime and are
invisible to the type system, and every caller has to launder them through a
cast:

- `packages/activerecord/src/migration/columns.test.ts:31-33` —
  `(conn as unknown as { indexNameLength(): number }).indexNameLength()`
- `packages/activerecord/src/migration/rename-table.test.ts:5-7` — the same
  shape for `tableNameLength`, via a local `TableNameLimits` interface

PR #7245 declared `indexNameLength()` on the interface so the ported
`index_test.rb` could call it verbatim as Rails does. The other four are still
undeclared, and the two casts above are still in place.

## Converged shape

Declare `maxIdentifierLength()`, `tableNameLength()`, `tableAliasLength()` and
`bindParamsLength()` on the `AbstractAdapter` interface beside the
`indexNameLength()` entry, then delete the casts and the local
`TableNameLimits` interface at the two call sites, so the tests read like the
Rails ones.

`bindParamsLength` carries `@internal` in the port; check whether Rails treats
it as public before declaring it, and keep the tag if so — the interface entry
and the tag are independent.

## Acceptance criteria

- All five database-limits methods are declared on `AbstractAdapter`.
- `columns.test.ts` and `rename-table.test.ts` call them directly, with no
  `as unknown as` and no local limits interface.
- `pnpm parity:api:extra --package activerecord` reports no new extra surface
  (these are Rails methods, so they should score as matched, not novel).
- `pnpm typecheck` and the AR suites pass on all three adapters.
