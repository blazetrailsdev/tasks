---
title: "ensure-schema-loaded-respects-subclass-table-name"
status: ready
updated: 2026-07-06
rfc: "0048-one-schema-no-drop-tests"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: 0
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Base.ensureSchemaLoaded` (packages/activerecord/src/base.ts:1242-1268) has a
fast-path bail-out: it loops `this._attributeDefinitions` and, if it finds a
non-virtual attr that is either `source:"schema"` or a non-enum `source:"user"`,
it returns `reconcileVirtualAttributes` instead of `loadSchema()`, assuming the
schema is already known.

`_attributeDefinitions` is copy-on-write per class (cloned only when a subclass
mutates it — attributes.ts:86-87, model-schema.ts:914-915). A subclass that
overrides `_tableName` but has not yet reflected reads its **ancestor's**
inherited map. If the ancestor was already reflected against a _different_
table, the bail check passes on the ancestor's columns and the subclass never
reflects its **own** table. `reconcileVirtualAttributes`
(model-schema.ts:1295-1308) only toggles `virtual` on existing entries — it
never adds the subclass's missing columns.

Empirically confirmed via `persist inherited class with different table name`
(persistence_test.rb:1451, ported in persistence.test.ts): an anonymous
`class extends Minimalistic { _tableName = "aircraft" }` inherits Minimalistic's
reflected `id`/`expires_at` (`source:"schema"`, from the `minimalistics` table,
which has no `name` column). `ensureSchemaLoaded` bails, `aircraft`'s columns
are never reflected onto the subclass, `name` is never defined as an attribute,
and `create({ name })` / `record.name =` silently drop the write —
`Aircraft.last().name` reads null. The test currently works around this with an
explicit `await Subclass.loadSchema()`.

Rails has no analogous bail-out: `column_names` / attribute methods are always
keyed per-class off the class's own `table_name`
(activerecord/lib/active_record/model_schema.rb), so a subclass overriding
`table_name` always reflects its own table regardless of what an ancestor knows.

This is a correctness bug: any subclass overriding `_tableName` whose ancestor
was already reflected against a different table silently gets an incomplete
schema and silently drops attribute writes instead of erroring.

## Acceptance criteria

- [ ] `ensureSchemaLoaded`'s fast-path bail distinguishes "own" attribute defs
      from defs inherited from an ancestor with a different `_tableName`; a
      subclass overriding `_tableName` reflects its own table's columns.
- [ ] Remove the `await MinimalisticAircraft.loadSchema()` workaround (and its
      explanatory comment) in persistence.test.ts's `persist inherited class
with different table name`; the test passes on sqlite/postgres/mysql in a
      full-file run without it.
- [ ] No regression to the virtual-attribute / enum-overlay reflection cases
      the fast path was added to protect (see base.ts:1243-1256 comment).
