---
title: "converge-collection-proxy-apply-scope-for-create"
status: done
updated: 2026-08-11
rfc: "0084-wide-call-set-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6383
claim: "2026-08-11T22:45:59Z"
assignee: "converge-collection-proxy-apply-scope-for-create"
blocked-by: null
closed-reason: null
---

## Context

Split out of `converge-association-initialize-attributes-inline` (RFC 0084).
That story inlined the Rails body of `Association#initialize_attributes`
(vendor/rails/activerecord/lib/active_record/associations/association.rb:216-224)
into `Association#initializeAttributes`
(`packages/activerecord/src/associations/association.ts`) and deleted the two
invented module-level helpers (`applyScopeForCreate`, `filterScopeForCreate`).

What remains is `CollectionProxy#_applyScopeForCreate`
(`packages/activerecord/src/associations/collection-proxy.ts:1410`), a private
re-implementation of the same Rails body, called from the proxy's `_build`
(`:1340`) and `_buildThrough` (`:1358`). Rails has no such method: its
collection build path is
`CollectionAssociation#build` → `add_to_target { |r| insert_record ... }` with
the record built by `build_record` (collection_association.rb), which calls
`reflection.build_association(attributes)` and then
`initialize_attributes(record, attributes)` — i.e. it routes through the
single `Association#initialize_attributes` this story just converged.

## Acceptance criteria

1. `CollectionProxy#_applyScopeForCreate` is deleted; the proxy's build paths
   route through `Association#initializeAttributes` (or the association-level
   `buildRecord`) so there is one implementation of
   `scope_for_create.except!(...)` in the port.
2. `_scopeForCreateRaw` goes away with it if it has no other caller.
3. has_many / has_many :through build + create tests stay green
   (`packages/activerecord/src/associations/has-many-associations.test.ts`,
   `has-many-through-associations.test.ts`, `collection-proxy.test.ts`).
