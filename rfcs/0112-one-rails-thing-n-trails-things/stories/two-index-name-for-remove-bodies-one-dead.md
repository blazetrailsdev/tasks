---
title: "Two index_name_for_remove bodies for Rails' one, the dead one diverged"
status: draft
updated: 2026-08-30
rfc: "0112-one-rails-thing-n-trails-things"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 160
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails has ONE `index_name_for_remove`
(`activerecord/lib/active_record/connection_adapters/abstract/schema_statements.rb:1521-1543`).
trails has two, in the same file, with divergent logic:

- `SchemaStatements#indexNameForRemove`
  (`packages/activerecord/src/connection-adapters/abstract/schema-statements.ts:1561`)
  — the one every adapter actually calls (`schema-statements.ts:454`,
  `sqlite3-adapter.ts:984`, `abstract-mysql-adapter.ts:1419`,
  `postgresql-adapter.ts:2096`).
- module-level `indexNameForRemoveFrom` (`schema-statements.ts:103`), plus its
  sibling `indexExistsForRemoveFrom` (`:142`) and the helpers only they use —
  `canRemoveIndexByName` (`:66`), `removeIndexSpec` (`:84`), and the local
  `isExpressionColumnName` (`:78`).

The module-level pair has **no production callers**: the only importer is
`abstract/schema-statements-privates.trails.test.ts:6`, a trails-only test. It
is not merely duplicated, it has diverged — it carries a
`canRemoveIndexByName` early return (return `options.name` verbatim when the
column is nil and `name` is the only non-`algorithm` key) that the live method
has no equivalent of, and Rails has no equivalent of either. So the two bodies
would answer differently for the same call, and the dead one is the more
inventive of the pair.

Surfaced while porting `migration/index_test.rb` (PR #7245): a PostgreSQL
failure traced through `indexNameForRemove` was initially read against the
wrong one of the two, because a grep for the name finds both.

## Converged shape

One `indexNameForRemove` on `SchemaStatements`, mirroring
`schema_statements.rb:1521-1543` line for line. Delete
`indexNameForRemoveFrom`, `indexExistsForRemoveFrom`, `canRemoveIndexByName`,
`removeIndexSpec` and the module-local `isExpressionColumnName`, along with the
`schema-statements-privates.trails.test.ts` cases that only exist to cover
them — the behaviour they assert belongs to the live method, and the Rails
counterpart is covered by `migration/index_test.rb`'s remove-index tests.

Check `canRemoveIndexByName`'s early return against
`schema_statements.rb:1521-1543` before deleting it: if Rails does have that
behaviour somewhere, it belongs in the live method, not in a second copy.

## Acceptance criteria

- `indexNameForRemoveFrom`, `indexExistsForRemoveFrom`, `canRemoveIndexByName`
  and `removeIndexSpec` no longer exist.
- One `index_name_for_remove` body remains, matching the Rails source's branch
  order and guards.
- `pnpm parity:api:extra --package activerecord` shows the removed names gone
  and no new extra surface; `pnpm parity:api:calls` and
  `parity:api:calls:args` stay green.
- AR suites pass on all three adapters.
