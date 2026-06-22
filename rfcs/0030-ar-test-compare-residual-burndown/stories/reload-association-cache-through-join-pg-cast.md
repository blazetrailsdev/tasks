---
title: "Un-skip reload-association-cache (PG through-JOIN type-cast + publication callback fix)"
status: in-progress
updated: 2026-06-22
rfc: "0030-ar-test-compare-residual-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 80
priority: 30
pr: 3871
claim: "2026-06-22T11:47:56Z"
assignee: "reload-association-cache-through-join-pg-cast"
blocked-by: null
---

## Context

Part of RFC 0030 residual burndown. The single test in
`packages/activerecord/src/persistence/reload-association-cache.test.ts`
(`reload sets correct owner for association cache`, mirroring
`activerecord/test/cases/persistence/reload_association_cache_test.rb`) was
written against the canonical Publication/Editor/Editorship models. It passes
on SQLite but fails on PostgreSQL, so it is left `it.skip` pending two fixes:

1. **PG through-association JOIN type-cast gap.** `publication.editors = [...]`
   loads the `editors`-through-`editorships` association via the JOIN path,
   which emits
   `... INNER JOIN editorships ON editors.name = editorships.editor_id WHERE editorships.publication_id = $1`
   binding the integer `publication.id` against the **string**
   `editorships.publication_id` column without casting → PG raises
   `operator does not exist: character varying = integer` (42883). The direct
   `publication.editorships` has_many casts the owner key to the column type
   correctly; only the through-JOIN scope path (AssociationScope JOIN route)
   does not. `editorships.publication_id`/`editor_id` are `string` in both the
   canonical `TEST_SCHEMA` and Rails' `schema.rb:577-580` (Editor's PK is
   `name`), so the schema is faithful — the cast must happen in the query layer.

2. **Publication callbacks use `this`.** `test-helpers/models/publication.ts`
   declares `afterInitialize`/`afterSaveCommit` with `function (this: Publication)`
   bodies, but trails invokes after-callbacks as `filter(record)` (record as the
   first arg, `this` unbound) — so `this.buildEditorInChief(...)` / `this.name`
   silently target `globalThis`. Fix: take the record argument, e.g.
   `this.afterInitialize((record) => { record.editorInChief = record.buildEditorInChief(...) })`.

## Acceptance criteria

- [ ] The through-association JOIN scope casts the owner key value to the FK
      column's type (mirroring Rails' bind type-casting), so a string-FK
      through-association (e.g. `publication.editors`) loads on PostgreSQL.
- [ ] `publication.ts` after_initialize / after_save_commit callbacks take the
      record argument.
- [ ] `reload sets correct owner for association cache` un-skipped and green on
      SQLite, PostgreSQL, and MySQL.
