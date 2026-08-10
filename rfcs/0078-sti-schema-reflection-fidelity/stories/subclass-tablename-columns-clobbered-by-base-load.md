---
title: "subclass-tablename-columns-clobbered-by-base-load"
status: closed
updated: 2026-08-09
rfc: "0078-sti-schema-reflection-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Repro no longer reproduces on origin/main: ran the story's exact Parent(topics)/Child(movies) sequence — Parent._returningColumnsForInsert=['id'], Child=['movieid'], Child.columns() carries movieid. Fixed by the per-class ownSchemaMemo/schemaStaleAgainstAncestors memo reads (model-schema.ts:74-104,281). The descendant-invalidation half is covered by reloadSchemaFromCache's subclasses recursion (:920)."
---

## Context

Surfaced while fixing Codex review feedback on PR #4960
(returning-columns-for-insert-memoize).

Loading a base model's schema clobbers a subclass's already-reflected
`_columns` when the subclass overrides `tableName`. Repro (verified against
canonical tables; `topics` PK `id`, `movies` PK `movieid` with no `id` column):

```ts
class Parent extends Base {
  static tableName = "topics";
}
class Child extends Parent {
  static tableName = "movies";
}
await Parent.loadSchema();
await Child.loadSchema();

// Child alone is correct:
Child.columns().map((c) => c.name); // ["movieid", "name"]  ✅
Child.primaryKey; // "movieid"            ✅

// But once the PARENT is queried first, the child is wrong:
Parent._returningColumnsForInsert(conn); // ["id"]
Child._returningColumnsForInsert(conn); // ["id"]  ❌ expected ["movieid"]
```

This is NOT a memoization artifact: it reproduces with
`_returningColumnsForInsert`'s memo entirely disabled, i.e. it is present on
`main` today. The wrong value comes from `columns()` itself — after the parent
call, the child resolves the parent's columns.

Rails does not share here: `@columns` is a class instance variable and is not
inherited (`activerecord/lib/active_record/model_schema.rb:432-434`), and
`reload_schema_from_cache` recurses through `subclasses`
(`model_schema.rb:553-569`).

Related pre-existing gap found alongside: trails'
`resetColumnInformation` (`packages/activerecord/src/model-schema.ts`, base
branch) clears only `this`, while Rails' `reload_schema_from_cache` recurses
into `subclasses`, so resetting a base leaves descendants' `_columns` stale.
A descendant walk is not a drop-in fix — trails subclass registration is
opt-in via `registerSubclass` (`inheritance.ts:363`) since Ruby's `inherited`
hook has no TS equivalent, so `descendants()` silently misses unregistered
models (verified: returns `[]` for a plain `class Child extends Parent {}`).
Any fix needs to address that registration gap too.

## Acceptance criteria

- [ ] A subclass overriding `tableName` keeps its own reflected `_columns` /
      `primaryKey` regardless of whether the base's schema was loaded or
      queried first (the repro above returns `["movieid"]`).
- [ ] `resetColumnInformation` on a base invalidates descendants' schema
      caches, or the registration gap that prevents it is closed//documented.
- [ ] Regression test using canonical tables only (`topics` / `movies`).
- [ ] parity:api and parity:test delta non-negative.
- The wide call-set ratchet entry for this defect is removed: `model-schema.ts`
  / `reset_column_information` / `table_name → tableName`. Reseed with
  `pnpm tsx scripts/api-compare/lint-call-mismatches-wide.ts --write` and commit
  the shrunk baseline. (Cross-referenced by the RFC 0084 survey, 2026-07-30 —
  one of 8 open fidelity stories whose actual defect the wide gate can see.)
