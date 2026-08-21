---
title: "converge-habtm-through-model-lazy-table-name"
status: in-progress
updated: 2026-08-21
rfc: "0106-wide-call-set-direct-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6827
claim: "2026-08-21T16:20:37Z"
assignee: "converge-habtm-through-model-lazy-table-name"
blocked-by: null
closed-reason: null
---

# HABTM `through_model` resolves the join table eagerly where Rails resolves it lazily

## Context

Surfaced by the leading-underscore call candidate (PR #6825), as an ORDER row:
`order:_tableName,computeType`.

Rails
(`activerecord/lib/active_record/associations/builder/has_and_belongs_to_many.rb:13-32`)
builds an anonymous `ActiveRecord::Base` subclass whose `table_name` is resolved
LAZILY — `@table_name ||= table_name_resolver.call`, with the comment "Table name
needs to be resolved lazily because RHS class might not have been loaded" — and
defines `compute_type` before any table name exists.

trails (`packages/activerecord/src/associations/builder/has-and-belongs-to-many.ts:33-62`)
computes `this._tableName()` eagerly at construction and builds a plain object
rather than an AR subclass, so the two calls land in the opposite order and the
lazy-resolution guarantee Rails documents is lost.

Baselined meanwhile in
`scripts/api-compare/call-mismatches-exclude/activerecord/associations/builder/has-and-belongs-to-many.json`.

## Acceptance criteria

- [ ] The join model is an `ActiveRecord::Base` subclass with a lazily-resolved
      `tableName`, in Rails' definition order.
- [ ] The baseline row is deleted and the shard mark tightened.
