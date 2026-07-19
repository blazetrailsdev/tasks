---
title: "resetColumnInformation must invalidate descendants like Rails' subclasses recursion"
status: draft
updated: 2026-07-19
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced in Codex review of PR #4960
(returning-columns-for-insert-memoize).

Rails' `reload_schema_from_cache(recursive = true)` clears the per-class
schema ivars and then recurses through `subclasses`
(`vendor/rails/activerecord/lib/active_record/model_schema.rb:553-569`), so
`reset_column_information` on a base invalidates every descendant.

trails inverts the delegation — `reloadSchemaFromCache`
(`packages/activerecord/src/model-schema.ts:1590`) calls
`resetColumnInformation`, not the other way round — and the base branch of
`resetColumnInformation` clears only `this`:

```ts
this._columnsHash = undefined;
this._columns = undefined;
this._returningColumnsForInsertCache = undefined;
this._attributesBuilder = undefined;
this._schemaLoaded = false;
```

So resetting a base leaves every descendant's `_columns`, `_columnsHash`,
`_schemaLoaded`, `_attributesBuilder` and returning-columns memo stale.

The obvious fix (walk `descendants()` and clear each) does NOT work as-is:
trails' subclass registration is opt-in via `registerSubclass`
(`packages/activerecord/src/inheritance.ts:363`) because Ruby's `inherited`
hook has no TS equivalent. Verified empirically — `descendants(Parent)`
returns `[]` for a plain `class Child extends Parent {}`, so a descendant walk
silently misses unregistered models and would leave exactly the stale state it
is meant to clear. `reloadSchemaFromCache`'s existing `recursive` branch reads
`(this as any).subclasses` and has the same hole.

Closing this therefore requires either automatic subclass registration or an
invalidation channel that does not depend on the registry.

Note: `_returningColumnsForInsert`'s memo (PR #4960) is safe on top of this
gap — its value is a pure function of `columns()`, so a stale memo is only ever
as stale as the `_columns` behind it, exactly what the pre-memo code
recomputing from those same columns already returned. It is listed here only
because it is one more field the reset should reach.

Closely related: [[subclass-tablename-columns-clobbered-by-base-load]] is the
other half of this area (a subclass overriding `tableName` has its `_columns`
clobbered by a base load). Both likely want fixing together.

## Acceptance criteria

- [ ] `resetColumnInformation` / `reloadSchemaFromCache` on a base invalidate
      descendants' schema caches, matching Rails' `subclasses` recursion.
- [ ] The subclass-registration gap is closed (automatic registration) or the
      invalidation is made registry-independent — a plain
      `class Child extends Parent {}` must be reached.
- [ ] Regression test with an unregistered subclass, canonical tables only.
- [ ] api:compare and test:compare delta non-negative.
