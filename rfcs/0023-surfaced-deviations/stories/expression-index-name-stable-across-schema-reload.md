---
title: "Expression-index name diverges between addIndex and schema dump/reload build path"
status: claimed
updated: 2026-06-17
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: 50
pr: null
claim: "2026-06-17T02:01:24Z"
assignee: "expression-index-name-stable-across-schema-reload"
blocked-by: null
---

## Context

Surfaced during d2-insert-all-unique-index-introspection (PR #3450). An
expression index on `books` declared as `t.index "(lower(external_id))"` gets a
DIFFERENT name depending on the build path:

- Direct `addIndex` / `addIndexOptions`
  (packages/activerecord/src/connection-adapters/abstract/schema-statements.ts)
  computes the Rails-default stripped name `index_books_on_lower_external_id`
  (via `indexNameOptions` -> `match(/\w+/g).join("_")`), and
  `visitCreateIndexDefinition` emits it from `index.name`.
- But the worker DB built through the schema dump/reload path
  (`generateSchemaFile` -> `DatabaseTasks.loadSchema`, and/or the sqlite
  template clone in template-global-setup.ts) ends up with the
  parenthesised name `index_books_on_(lower(external_id))` instead.

Confirmed on sqlite (and the PG path) with zero stale tmp artifacts:
`addIndexOptions` logged the stripped name yet `PRAGMA index_list(books)`
reported the parenthesised one. Root cause was not pinned down. d2 worked
around it by pinning an explicit `name: "index_books_on_lower_external_id"` on
the canonical books expression index in test-schema.ts, so unique_by-by-name
matching works — but the underlying name instability remains.

## Acceptance criteria

- [ ] Identify why the dump/reload (and/or template-clone) path names an
      expression index from its raw parenthesised SQL instead of the stripped
      Rails-default name that `addIndexOptions` computes.
- [ ] Make expression-index names identical across direct `addIndex` and the
      schema dump/reload + template-clone paths.
- [ ] Once stable, the explicit `name:` pin on the canonical `books`
      `(lower(external_id))` index in test-schema.ts can be dropped.
