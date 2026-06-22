---
title: "Remove _castAttributeValue parseInt untyped-PK fallback once schema cache is always warm"
status: ready
updated: 2026-06-18
rfc: "0031-schema-cache-always-warm-convergence"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: 20
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Rails has no untyped-PK fallback: `find` casts the id through the column type
that `load_schema!` always populates (it eagerly loads `db/schema_cache.yml` at
boot). trails reflects lazily/async, so `Base._castAttributeValue`
(`packages/activerecord/src/base.ts`, the PK branch) keeps a `parseInt(value, 10)`
fallback for a string id when the implicit PK has no attribute def — i.e. a
partially-declared model on a cold schema cache with no in-memory same-table
sibling to borrow from.

PR #3594 (story `pg-untyped-pk-int8-deserialization`) narrowed this: it added a
sync `ModelSchema.loadSchema` reflection (query-free, reads the warm cache) in
`_castAttributeValue`, and made `model-schema.ts` `loadSchema` borrow the PK def
from a same-table sibling / stay non-terminal when the PK is missing. The
fallback is now reached only in the genuinely-unsolvable cold-cache +
no-sibling case. On PG (`bigserial`/int8) this fallback returns a JS `number`
while the read path deserializes to `BigInt` — input-cast and read diverge.

Forcing an async `loadSchema()` on the `find` path to cover the cold case was
tried in #3594 and reverted: it issues DB reflection queries and breaks the
Rails `assert_no_queries { Task.find(1) }` behavior after
`reset_column_information` (`QueryCacheTest > query cached even when types are
reset`).

This is a sibling of `r3-remove-sibling-borrow-and-recovery` /
`r2-drop-synthesize-converge-adhoc-model-tests`: once the eager persistent
schema cache (`r1-eager-persistent-schema-cache-test-harness`) guarantees the
cache is always warm, the cold-cache path can never be hit, and this
`parseInt` fallback in `_castAttributeValue` becomes dead Rails-deviating code.

## Acceptance criteria

- [ ] After the always-warm schema cache lands, remove the `parseInt` untyped-PK
      fallback branch in `Base._castAttributeValue` (and the now-redundant sync
      `ModelSchema.loadSchema` reflection guard there if subsumed by warm-cache
      guarantees).
- [ ] The PK always casts through its adapter-resolved column type on every lane
      (PG int8→BigInt, mysql/sqlite→number); no JS `number` leaks for a bigint PK.
- [ ] Sequenced after / coordinated with `r3-remove-sibling-borrow-and-recovery`
      so the model-schema borrow and this cast-path fallback are removed together.
- [ ] No regression to `QueryCacheTest > query cached even when types are reset`
      (no DB queries on the post-reset cached `find`).
