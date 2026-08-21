---
title: "Delete reflectColumnNames' warm-cache re-invalidation — Rails has one column view"
status: ready
updated: 2026-08-21
rfc: "0078-sti-schema-reflection-fidelity"
cluster: null
packages: []
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

Surfaced while deleting the schema-revision epoch in PR #6809.

`reflectColumnNames` (`packages/activerecord/src/model-schema.ts`, inside the
`internalSchemaCache` branch) carries a block Rails has no counterpart for: after
fetching the table's columns it notices the shared schema cache has just gone
warm, and if the class had already settled a load off the COLD-cache synthesized
view (`loadSchema`'s fallback sets `_schemaLoaded` from declared attributes
alone), it invalidates that view so the next `loadSchema` re-reflects.

Rails never does this. `load_schema!` reads `schema_cache.columns_hash(table_name)`
and that is the only view there is
(`vendor/rails/activerecord/lib/active_record/model_schema.rb:587-597`); there is
no second, poorer view to notice and discard, because Rails' schema cache lookup
is synchronous and either answers or raises. The block exists only because
trails' reflection is async, so a sync `loadSchema` can settle against a cold
cache and be wrong later.

PR #6809 collapsed the block's body onto `reloadSchemaFromCache` (it had been an
open-coded third copy of that method's field-nilling, and had to grow a
descendant recursion when the epoch went away). That is as close to Rails as the
site can get while the site itself exists — the remaining deviation is the site.

## Converged shape

Delete the block. It goes when a sync `loadSchema` can no longer settle against a
cold cache — i.e. with the sync-schema-reflection work that
`converge-attribute-definitions-activerecord-owners` is blocked on, and with the
synthesized-`columnsHash` fallback in `loadSchema` that creates the poorer view
in the first place. Do NOT converge it by rewriting the block; converge it by
removing the reason it is needed.

## Acceptance criteria

- [ ] The warm-cache invalidation block in `reflectColumnNames` is deleted.
- [ ] `loadSchema` no longer settles `_schemaLoaded` against a synthesized
      cold-cache view, so there is one column view as in Rails.
- [ ] No regression in `model-schema*`, `attributes`, `persistence` and `sti/`.

## Dependencies

With the sync-schema-reflection work.
