---
title: "Converge UniquenessValidator#covered_by_unique_index? using async schema cache"
status: ready
updated: 2026-07-19
rfc: "0063-async-validation-chain"
cluster: null
deps: []
deps-rfc: []
est-loc: 130
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`UniquenessValidator#covered_by_unique_index?` (Rails
activerecord/lib/active_record/validations/uniqueness.rb) skips the
existence-check SELECT before save when the value/scope columns are
unchanged AND a non-partial unique index already covers them — the DB
will enforce uniqueness on INSERT, so the pre-check is redundant.

trails' `isCoveredByUniqueIndex`
(packages/activerecord/src/validations/uniqueness.ts) is hardcoded to
return `false`, so the optimization is disabled and uniqueness always
issues the SELECT. The original reason (documented in the helper's
comment) was that `SchemaCache#indexes` is async and could not be called
from the _synchronous_ validator path.

That constraint is now gone: after `uniqueness-inline-delete-deferred-registry`
(#4926, RFC 0063) `validateEach` is async and runs inside the awaited
validation chain, so `isValidationNeeded` / `isCoveredByUniqueIndex` can
be made async and consult `klass.schemaCache.indexes(tableName)` to
reproduce Rails' `covered_by_unique_index?` (skip-when-unchanged-and-
uniquely-indexed).

- packages/activerecord/src/validations/uniqueness.ts — `isCoveredByUniqueIndex`
  (returns false) and `isValidationNeeded` (its sync caller); `validateEach`
  is already async and awaits.
- Rails reference: `covered_by_unique_index?` reads
  `klass.schema_cache.indexes(klass.table_name)`, matching column set
  against a unique, non-partial index (where/type nil).

## Acceptance criteria

- `isCoveredByUniqueIndex` consults the (async) schema-cache index list and
  returns true when the attribute + scope columns are exactly covered by a
  unique, non-partial index and none of them changed — matching Rails'
  `covered_by_unique_index?`.
- Uniqueness skips the redundant existence SELECT in that case (assert via a
  query spy / no SELECT), and still validates when a column changed or no
  covering unique index exists.
- Coverage ported from / matching Rails' uniqueness index-optimization test.
