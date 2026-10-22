---
title: "Application models declare table name and primary key through _tableName / _primaryKey, the backing fields"
status: ready
updated: 2026-10-18
rfc: "0189-activerecord-surfaced-deviations"
cluster: null
packages:
  - "activerecord"
deps: []
deps-rfc: []
est-loc: 120
priority: 33
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

Surfaced by trailmap#53 (`/graphs/parity`).

Every trailmap model that does not follow the naming convention names its table
with `static _tableName = "..."`, and `PullRequest` (app/models/pull-request.ts:22-23)
adds `static _primaryKey = "number"`. Those are the framework's backing fields,
not its API:

- `packages/activerecord/src/base.ts:464` — `static _tableName: string | null = null;`
- `packages/activerecord/src/base.ts:465` — `declare static _primaryKey?: ...`
- `packages/activerecord/src/base.ts:655-661` — the real `tableName` getter/setter
- `packages/activerecord/src/base.ts:663-669` — the real `primaryKey` getter/setter

The public spelling, `static tableName = "x"`, is a class field: it defines an
own data property over the accessor and never runs `ModelSchema.setTableName`
— the same hazard as `abstract-class-as-a-static-field-is-inherited`. trails'
own tests write it that way (base.trails.test.ts:255, core.trails.test.ts:293),
so the hazard is not confined to applications.

## Expected shape

Rails is `self.table_name = "pull_requests"` / `self.primary_key = "number"` in
the class body. An application should have one documented spelling that goes
through the setter and does not touch an underscore field — either the
`static { this.tableName = "..." }` block is the blessed form and `trails g
model` / the docs say so, or the declaration is made safe as a class field.

## Also check

`pull_requests.number` is the table's declared PRIMARY KEY. With
`schema-cache-custom-primary-key-inference` done, `_primaryKey` should be
unnecessary there; the trailmap comment says lookups fail without it. Not
re-verified at the current pin — confirm, and if it still fails that is its
own reflection bug on `node-sqlite`.

## Acceptance

- [ ] one documented, setter-backed way to declare table name and primary key
- [ ] a test that a subclass of a model declared that way resolves its own table
- [ ] trailmap's `_tableName` / `_primaryKey` uses can be replaced with it

## Audit 2026-10-22

The `base.ts:655-669` accessor citations above are stale; the accessors now live
in `model-schema.ts` / `attribute-methods/primary-key.ts`. Trails' own tests still spell
the underscore field widely (e.g. `enum.test.ts`'s `static _tableName = "books"`).
