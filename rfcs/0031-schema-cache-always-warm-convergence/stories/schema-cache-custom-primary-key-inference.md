---
title: "Schema cache should expose custom primary key for id:false tables (drop explicit _primaryKey)"
status: draft
updated: 2026-06-16
rfc: "0031-schema-cache-always-warm-convergence"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Surfaced while canonicalizing `has_and_belongs_to_many_associations_test.ts`
(RFC 0019, PR #3480). The canonical `Country` / `Treaty` models had to declare
`static _primaryKey = "country_id" / "treaty_id"` explicitly, which **deviates
from Rails** — `country.rb` / `treaty.rb` declare no `self.primary_key`; Rails
infers it from the table (`schema.rb` `create_table :countries, id: false` +
`t.string :country_id, primary_key: true`).

trails is already wired to infer it: `getPrimaryKeyAttr`
(attribute-methods/primary-key.ts:170-181) consults
`connection.schemaCache.getCachedPrimaryKeys(table)` before falling back to the
`"id"` convention. But for these `id: false` canonical tables the lookup misses
(`Country.primaryKey` returned `"id"` even after `loadSchema()`), so the
fallback wins and the explicit declaration is required. TEST_SCHEMA already
carries `primaryKey: ["country_id"]` / `["treaty_id"]` for these tables, so the
gap is that the schema cache (`getCachedPrimaryKeys`) does not surface it.

## Acceptance criteria

- [ ] `connection.schemaCache.getCachedPrimaryKeys(table)` returns the
      configured primary key for `id: false` canonical tables (countries,
      treaties, …), so `Model.primaryKey` infers it without an explicit
      `_primaryKey`.
- [ ] Remove the explicit `static _primaryKey` from `test-helpers/models/country.ts`
      and `treaty.ts` (matching Rails country.rb / treaty.rb, which declare none)
      and confirm the HABTM tests still resolve the PK.
- [ ] No regression in the schema-cache / primary-key suites.
