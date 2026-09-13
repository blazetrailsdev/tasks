---
title: "converge-collection-proxy-load-select-onto-relation"
status: draft
updated: 2026-09-13
rfc: "0130-activerecord-extra-surface-receipt-burndown"
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

Surfaced by `receipt-moved-associations-and-attribute-methods` (RFC 0130).
`packages/activerecord/src/associations/collection-proxy.ts` overrides three
names Rails' `CollectionProxy` (`associations/collection_proxy.rb`) inherits
from `Relation`, and each carries a
`@noRailsEquivalent CONVERGEABLE converge-collection-proxy-load-select-onto-relation`
receipt:

- `load` — `Relation#load` (`activerecord/lib/active_record/relation.rb:1179`);
  CollectionProxy only overrides `records` (`collection_proxy.rb:1024`), which
  `load` reaches.
- `toArray` — `Relation#to_ary` / `records` (`relation.rb:337-345`).
- `select` — `QueryMethods#select` (`relation/query_methods.rb:413`), whose
  block arm already does `to_a.select`; the TS overload re-implements it.

## Acceptance criteria

- `CollectionProxy` overrides `records` like Rails and inherits `load` / `toArray` / `select` from Relation.
- The three receipts are removed; `pnpm parity:api:extra:tighten` narrows activerecord's `total`.
- collection-proxy and has_many association suites stay green.
