---
title: "oo-addtotarget-or-in-distinct-value"
status: ready
updated: 2026-07-05
rfc: "0033-standalone-associations-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `CollectionAssociation#add_to_target` computes
`replace: replace || association_scope.distinct_value`
(vendor/rails/activerecord/lib/active_record/associations/collection_association.rb:281-283),
so a `distinct` association scope dedups the record in place even when the caller
passes no explicit `replace:`. The runtime `CollectionProxy#_addToTarget`
callers already thread this through manually as `{ replace: this.distinctValue }`
(packages/activerecord/src/associations/collection-proxy.ts, e.g. :1285, :1919,
:3795). The OO path does NOT: both `CollectionAssociation#addToTarget`
(collection-association.ts:515) and the `addToTargetAsync` used by
`concatRecords` (collection-association.ts:238) pass no `replace` option, so a
`distinct` has-many/HABTM concat can append a duplicate instead of replacing in
place.

Surfaced in review of PR #4619 (oo-concatrecords-insert-inside-add-to-target);
pre-existing gap, out of scope for that ordering-only convergence.

## Acceptance criteria

- `CollectionAssociation#addToTarget` / `addToTargetAsync` OR in the association
  scope's `distinctValue` into the effective `replace` flag, mirroring Rails'
  `replace || association_scope.distinct_value`.
- A `distinct` association concat dedups in place (no duplicate target entry),
  matching the runtime `CollectionProxy` path.
- Non-distinct paths unchanged.
