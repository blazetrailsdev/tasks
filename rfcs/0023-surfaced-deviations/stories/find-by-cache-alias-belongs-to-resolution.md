---
title: "find_by statement cache: resolve attribute aliases + belongs_to FK before cache check"
status: draft
updated: 2026-06-14
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Surfaced by PR #3235 (story `f9-statement-cache-pool-introspection`), which
wired `Core#find_by` / `Core#find` through the cached `StatementCache`.

Rails `Core#find_by` (core.rb) normalizes each key before deciding whether to
use the cache: it resolves `attribute_aliases[key]`, and for a belongs_to
(non-polymorphic) association key it dereferences the association object to the
`join_foreign_key` column + `join_primary_key` value (and `value = value.id` for
plain records). Only then does it apply the `columns_hash.key?` /
`unsupported_value?` guard.

Our `findByThroughCache` (core.ts) only checks `columnNames` — so an alias key
or `find_by({ author: postInstance })` fails that check and takes the relation
path. Behavior is correct (the relation path handles both), but it's a missed
cache hit and a fidelity gap.

## Acceptance criteria

- `find_by` resolves attribute aliases to the underlying column before the
  cache-key/column check, so aliased lookups hit the statement cache.
- `find_by` with a belongs_to association key dereferences to the FK column +
  PK value (composite-PK aware), matching Rails `find_by`.
- Plain-record values are reduced via `value.id` before the `unsupported_value?`
  guard.
- Tests cover aliased-column find_by and `find_by({ assoc: record })` going
  through the cache (assert the cached statement is reused).
