---
title: "Delete reflectColumnNames' warm-cache re-invalidation — Rails has one column view"
status: closed
updated: 2026-08-31
rfc: "0123-blocked-convergence-holding"
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
closed-reason: 'Premise gone on origin/main. Both live ACs are satisfied by PR #7091 (773a05da3, ''retire reconcileVirtualAttributes and the virtual-attribute flag'', RFC 0115), which deleted reflectColumnNames outright: `git grep -n reflectColumnNames origin/main -- packages` now returns ZERO hits, so AC1 (delete the warm-cache invalidation block inside reflectColumnNames) has nothing left to delete. AC2 is met too: loadSchemaBangAnchor (model-schema.ts:557-571) no longer synthesizes a cold-cache columnsHash from declared attributes — it sets _schemaLoaded = true ONLY on the reflected path from loadSchemaFromCacheSync (model-schema.ts:689) and otherwise sets _columnsHash = {} without settling _schemaLoaded, so there is one column view as in Rails. No equivalent ''if (ownSchemaMemo(host, "_schemaLoaded")) reloadSchemaFromCache.call(host)'' re-invalidation survives anywhere in model-schema.ts. The remaining sync-schema-reflection debt is still tracked by the other eight stories in this holding epic.'
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
