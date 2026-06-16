---
title: "InsertAll#primaryKeys reads model.primaryKey, not schema_cache.primary_keys (insert_all.rb:61)"
status: claimed
updated: 2026-06-16
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: 28
pr: null
claim: "2026-06-16T23:48:42Z"
assignee: "insert-all-primarykeys-via-schema-cache"
blocked-by: null
---

## Context

Surfaced in review of PR #3454 (`d2-insert-all-partitioned-indexes`, RFC 0030).
`InsertAll#primaryKeys()` (`packages/activerecord/src/insert-all.ts:183-193`)
reads `this.model.primaryKey`, whereas Rails computes
`Array(@model.schema_cache.primary_keys(model.table_name))` (insert_all.rb:61) —
a schema-cache lookup, not the model's attribute-derived `primary_key`.

For the no-PK case both yield `[]` (PR #3454 added the `pk == null || pk === ""`
guard so a key-less/partitioned table no longer emits `RETURNING ""`), so this is
behaviorally correct today. But the source of truth differs: a model whose
`primaryKey` attribute diverges from the table's actual schema-cache primary keys
(e.g. an overridden `self.primary_key` that doesn't match the DB, or
composite-PK edge cases) would compute a different conflict-target / returning set
than Rails.

Related: `model-loadschema-nil-primary-key-from-introspection` (RFC 0030, the
introspection half that would make `model.primaryKey` itself reflect the
schema-cache value for key-less tables).

## Acceptance criteria

- [ ] `InsertAll#primaryKeys()` consults `schema_cache.primary_keys(tableName)`
      (or the trails equivalent) rather than `this.model.primaryKey`, matching
      insert_all.rb:61.
- [ ] No regression in the no-PK / partitioned path (still `[]`, no `RETURNING ""`).
- [ ] Existing insert-all/upsert-all tests stay green on sqlite/PG/mysql.
