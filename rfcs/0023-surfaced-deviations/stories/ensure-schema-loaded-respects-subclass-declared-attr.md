---
title: "ensureSchemaLoaded: subclass declaring attribute() before reflect still bails on ancestor's foreign table"
status: claimed
updated: 2026-07-06
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: "2026-07-06T16:53:04Z"
assignee: "ensure-schema-loaded-respects-subclass-declared-attr"
blocked-by: null
closed-reason: null
---

## Context

Follow-up to PR #4680 (ensure-schema-loaded-respects-subclass-table-name).
`Base.ensureSchemaLoaded` (packages/activerecord/src/base.ts:1257-1291) forces
reflection when the class that _owns_ the copy-on-write `_attributeDefinitions`
map is a table-backed ancestor whose `tableName` differs from `this`. This
fixes the case where a subclass overrides `_tableName` but has not yet mutated
its attribute map (so it inherits the ancestor's map directly).

Residual edge NOT covered: if the subclass calls `attribute()` (e.g. declares a
virtual attr) _before_ reflecting its own table, `attributes.ts:86-87` clones
the ancestor's map into the subclass — copying the ancestor's schema-reflected
columns from the _different_ table. Now `defsOwner === this`, the owner-check is
skipped, the fast-path loop finds those copied `source:"schema"` attrs and bails
to `reconcileVirtualAttributes` — so the subclass never reflects its own table
and silently drops writes, the same failure mode PR #4680 fixed for the
no-declare case.

Rails has no analogous bail: `column_names`/attribute methods are always keyed
per-class off the class's own `table_name`
(activerecord/lib/active_record/model_schema.rb), so a subclass overriding
`table_name` always reflects its own table regardless of ancestor state.

A robust fix likely needs the schema-sourced defs to record which table they
were reflected against (so a bail only trusts defs matching `this.tableName`),
rather than inferring table identity from map ownership.

## Acceptance criteria

- [ ] A non-STI subclass that overrides `_tableName` AND declares an
      `attribute()` before first reflection still reflects its own table's
      columns (writes to its own columns persist; reads return them).
- [ ] Add a regression test mirroring `persist inherited class with different
table name` but with a `static attribute(...)` / virtual-attr declaration
      on the subclass before the first create.
- [ ] No regression to the STI fast-path or the PR #4680 owner-check case.
