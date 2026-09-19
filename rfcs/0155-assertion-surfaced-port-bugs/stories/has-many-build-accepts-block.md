---
title: "has-many-build-accepts-block"
status: draft
updated: 2026-09-19
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
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

Parked test: `build via block` in `packages/activerecord/src/associations/has-many-associations.test.ts` (`it.skip`, converged body intact). Rails: `has_many_associations_test.rb:1216-1225` calls `company.clients_of_firm.build { |client| client.name = "Another Client" }` (block as the only argument).

trails' `CollectionProxy#build` (`associations/collection-proxy.ts:244-256`) takes the block as a second parameter after `attributes`; passing a function as the first argument reaches `assignAttributes` and raises `ArgumentError: When assigning attributes, you must pass a hash as an argument, Function passed.` Rails: `CollectionAssociation#build(attributes = nil, &block)` (`collection_association.rb:117-123`). Cause of the shape not investigated beyond that.

## Acceptance criteria

- `build(fn)` on a has_many proxy treats a lone function as the block, as Ruby's `&block` does.
- Unskip `build via block`; it passes unchanged.
