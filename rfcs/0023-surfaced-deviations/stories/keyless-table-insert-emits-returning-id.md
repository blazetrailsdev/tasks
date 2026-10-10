---
title: "a model on a key-less table answers primaryKey 'id' after a reconnect, so its INSERT emits RETURNING id"
status: in-progress
updated: 2026-10-10
rfc: "0023-surfaced-deviations"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 90
priority: 1
pr: trails#8739
claim: "2026-10-10T01:50:48Z"
assignee: "keyless-table-insert-emits-returning-id"
blocked-by: null
closed-reason: null
---

## Context

Found by trailmap bumping its vendored trails from `c83105fc59` to
`65b6b02f73`. Every INSERT into a table created with `{ id: false }` emits a
RETURNING clause naming a column that does not exist:

```text
INSERT INTO "story_deps" ("story_id", "depends_on_id") VALUES (?, ?) RETURNING "id"
SQLite3::SQLException: no such column: "id"
```

It hits all four of trailmap's join models — `StoryDep`, `StoryRfcDep`,
`StoryPath`, `StoryPackage` — failing 8 tests across two files. The models
declare no primary key, as in Rails, and these tests passed on the old pin.

## Reproduction

No vitest needed. Establish a connection, migrate, insert — then do it a
SECOND time against a fresh database, which is what a `beforeEach` harness
does:

```ts
await migrateScratchDatabase(); // :memory:, establishConnection + migrate
await loadModelSchemas();
await StoryDep.create({ story_id: "a", depends_on_id: "b" }); // OK

await migrateScratchDatabase(); // a NEW :memory: connection
await loadModelSchemas();
await StoryDep.create({ story_id: "a", depends_on_id: "b" }); // raises
```

Instrumenting `sqlForInsert` shows what changed, and it is not the pk:

| cycle | pin          | `pk`    | `returning` | result     |
| ----- | ------------ | ------- | ----------- | ---------- |
| 1st   | both         | `false` | `[]`        | OK         |
| 2nd   | `c83105fc59` | `"id"`  | `[]`        | OK         |
| 2nd   | `65b6b02f73` | `"id"`  | `["id"]`    | **raises** |

So the stale `"id"` is PRE-EXISTING on both pins. What is new is
`_returningColumnsForInsert`, a faithful port of
`model_schema.rb:436-444` — it falls back to `Array(primary_key)`, which turns
the pre-existing wrong pk into a wrong RETURNING clause.

## Where the wrong pk comes from

`attribute-methods/primary-key.ts`:

```ts
export function getPrimaryKeyAttr(this: PrimaryKeyHost) {
  const configured = this._primaryKey;
  if (configured !== undefined) return configured;
  if (isPrimaryKeyReflected(this)) { resetPrimaryKey.call(this); return this._primaryKey; }
  const base = baseClass.call(this);
  return getPrimaryKey.call(this, base.name);      // ← "id"
}

function isPrimaryKeyReflected(host) {
  ...
  return tableName != null &&
    cachedSchemaCacheFor(base)?.getCachedPrimaryKeys?.(tableName) !== undefined;
}
```

`isPrimaryKeyReflected` uses CACHE PRESENCE as a proxy for "the table is
reflectable". After `establishConnection`, the new pool's schema cache is cold,
so a key-less table reads as un-reflected and resolution falls through to the
`"id"` default.

Rails asks a different question in `get_primary_key`
(`model_schema.rb:536-548`): `if ActiveRecord::Base != self && table_exists?`
— table EXISTENCE, not cache warmth. A cold cache there costs a query; it does
not change the answer. Here it does.

## The open question for whoever takes this

`primaryKey` is a SYNCHRONOUS getter and reflection is async, which is
presumably why the cache was used as the test. Resolving that is the design
decision this story needs:

- warm the primary-key cache wherever columns are warmed (`loadSchema` does not
  currently populate `getCachedPrimaryKeys`), so the sync getter has an answer;
- or make the un-reflected fallback distinguish "table absent" from "cache
  cold", and not answer `"id"` for the latter.

Either way the invariant is Rails': a model on a key-less table answers nil,
and its INSERT carries no RETURNING.

## Acceptance criteria

- [ ] The reproduction above inserts on the second cycle as it does on the
      first.
- [ ] A test in activerecord: a model on a `{ id: false }` table, connection
      re-established, asserts `primaryKey` is null and the emitted INSERT has
      no RETURNING clause. It fails on `65b6b02f73`.
- [ ] `_returningColumnsForInsert` is left faithful to
      `model_schema.rb:436-444` — the fix belongs in the pk resolution, not in
      suppressing the returning list.
- [ ] trailmap's `ranking.test.ts` and `semantic-validation.test.ts` pass
      against the bumped tarballs (8 tests).
