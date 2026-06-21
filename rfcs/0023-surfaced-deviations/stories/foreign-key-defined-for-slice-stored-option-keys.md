---
title: "ForeignKeyDefinition.isDefinedFor should slice lookup to stored option keys (defined_for? options.slice)"
status: done
updated: 2026-06-21
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: 3809
claim: "2026-06-21T17:18:42Z"
assignee: "foreign-key-defined-for-slice-stored-option-keys"
blocked-by: null
---

## Context

Surfaced during PR #3804 (foreign-key-defined-for-generic-option-matching). Rails
`ForeignKeyDefinition#defined_for?`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/schema_definitions.rb:162`)
opens with `options = options.slice(*self.options.keys)`, restricting the generic
comparison to keys the FK _actually stores_. A lookup key the definition never
carried is sliced out and therefore ignored (matches).

trails models FK options as always-present resolved typed fields
(`packages/activerecord/src/connection-adapters/abstract/schema-definitions.ts`:
`isDefinedFor`), e.g. `primaryKey` defaults to `"id"` via the constructor rather
than a raw stored-options hash. So a hand-built `ForeignKeyDefinition` lacking an
explicit `primary_key` mismatches `isDefinedFor({ primaryKey: "wrong" })` where
Rails slices `:primary_key` out and returns true.

Low impact: all three DB-introspection paths (pg/mysql/sqlite `foreignKeys`)
always populate `column`/`name`/`primaryKey`/`onDelete`/`onUpdate`/`deferrable`,
so every realistic `foreignKeyExists?` lookup already matches Rails. The divergence
only manifests for hand-built definitions queried on a key they didn't explicitly
set — not an adapter-API path.

## Acceptance criteria

- [ ] `isDefinedFor` ignores lookup keys the definition does not actually carry,
      mirroring `options.slice(*self.options.keys)` (requires tracking which option
      keys were explicitly set, since trails has no raw-options hash today).
- [ ] Preserve existing element-wise `to_s`/`Array()` comparison semantics.
- [ ] No test-name changes; verify on all three adapters.
