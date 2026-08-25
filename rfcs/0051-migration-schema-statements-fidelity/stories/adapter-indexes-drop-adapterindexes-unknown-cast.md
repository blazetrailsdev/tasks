---
title: "Reach the adapter's indexes() from SchemaStatements without an as-unknown-as cast"
status: done
updated: 2026-08-02
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: 5876
claim: "2026-08-02T12:06:48Z"
assignee: "adapter-indexes-drop-adapterindexes-unknown-cast"
blocked-by: null
closed-reason: null
---

## Context

`SchemaStatements#adapterIndexes`
(`packages/activerecord/src/connection-adapters/abstract/schema-statements.ts`,
search `private adapterIndexes`) still reaches the adapter's own `indexes()`
through `this as unknown as { indexes(t: string): Promise<IndexDefinitionRow[]> }`.
Since #5854 turned `SchemaStatements` into a `this`-mixin, `this` is typed as
the mixin class, which does not see the concrete adapter's `indexes` override,
so the cast is the only way to call it.

Rails has no such split: `index_exists?` / `index_name_for_remove` call
`indexes(table_name)` directly on the adapter
(`activerecord/lib/active_record/connection_adapters/abstract/schema_statements.rb:102`,
`:1647`).

## Acceptance criteria

- `adapterIndexes` (or its call sites) reaches `indexes()` without an
  `as unknown as` cast — e.g. via a host interface the mixin is typed against.
- No behavior change; `pnpm typecheck` clean; `mixin-declaration-drift` passes.
