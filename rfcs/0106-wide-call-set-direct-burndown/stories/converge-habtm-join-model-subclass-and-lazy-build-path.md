---
title: "converge-habtm-join-model-subclass-and-lazy-build-path"
status: done
updated: 2026-08-21
rfc: "0106-wide-call-set-direct-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6827
claim: "2026-08-21T18:38:20Z"
assignee: "converge-habtm-through-model-lazy-table-name"
blocked-by: null
closed-reason: null
---

## Context

`converge-habtm-through-model-lazy-table-name` (RFC 0106) was closed under
PR #6825, which shipped only half of it: `throughModel` got a
`tableNameResolver` on the old object-literal join model
(`packages/activerecord/src/associations/builder/has-and-belongs-to-many.ts`),
but two gaps remained against
`activerecord/lib/active_record/associations/builder/has_and_belongs_to_many.rb:13-56`:

1. The join model was a plain object, not `Class.new(ActiveRecord::Base)`, so
   `compute_type` / `add_left_association` / `add_right_association` /
   `connection_pool` had no Rails seats and the two calls landed in the opposite
   order (`order:_tableName,computeType`).
2. `throughModel` is not the path a HABTM declaration actually takes. `_build`
   calls `deps.createHabtmJoinModel` with an EAGERLY resolved join-table name
   (`defaultJoinTableName`, associations.ts), which looks the RHS up in
   `modelRegistry` — so a HABTM declared before its target class latched the
   name-derived fallback for good. That is precisely what Rails' comment guards
   against: "Table name needs to be resolved lazily because RHS class might not
   have been loaded" (rb:25-26).

## Acceptance criteria

- [ ] The join model is an `ActiveRecord::Base` subclass with `tableName`
      resolved lazily through `tableNameResolver`, in Rails' definition order,
      with `computeType` / `addLeftAssociation` / `addRightAssociation` /
      `connectionPool` at their Rails names.
- [ ] `_build` passes a RESOLVER to `createHabtmJoinModel`; the join model's
      `_tableName` resolves on first read.
- [ ] The derived join-table name is no longer written onto the HABTM
      reflection options — Rails' `hm_options` allowlist forwards `:join_table`
      only when the declaration supplied one (associations.rb:1899), and
      `HasAndBelongsToManyReflection#join_table` otherwise derives at use time.
- [ ] No call-mismatch baseline row for `through_model`.
