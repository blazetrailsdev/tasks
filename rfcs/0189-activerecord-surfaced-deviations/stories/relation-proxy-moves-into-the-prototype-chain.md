---
title: "relation-proxy-moves-into-the-prototype-chain"
status: in-progress
updated: 2026-10-30
rfc: "0189-activerecord-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#9482
claim: "2026-10-30T03:57:12Z"
assignee: "relation-proxy-moves-into-the-prototype-chain"
blocked-by: null
closed-reason: null
---

## Context

Every relation of a model with a delegate class (`DelegateCache.initializeRelationDelegateCache`, `packages/activerecord/src/relation/delegation.ts:79-91`) is a per-instance `Proxy` over `CLASS_SPECIFIC_RELATION_HANDLER` (`packages/activerecord/src/relation.ts`, constructor and `rbDefineAllocFunc`). Rails' `ClassSpecificRelation` is a per-model subclass whose `method_missing` (`relation/delegation.rb:113-128`) delegates to the model. The JS shape that matches it is a `Proxy` spliced into the delegate's prototype chain (the "Proxy (proto chain)" rows of root CLAUDE.md § "Ruby protocol methods with a different JS mechanism"), which only traps a lookup that missed. The instance Proxy, by contrast, traps every read, write and clone of every relation.

Measured on the $12 Server Challenge example (trails#9425): turning the instance Proxy off entirely cut CPU per request by another ~8% on top of trails#perf-relation-proxy-fast-paths' traps.

The blocker: the handler's `has` trap answers `Symbol.iterator in rel` as false for a relation whose records are not synchronously loaded. `arel/src/predications.ts:42` relies on that to tell an unloaded relation (a subquery) from an Array. A prototype-chain `has` trap has no receiver, so it cannot read `_isRecordsSynchronous`.

## Acceptance criteria

- A model's relation is an ordinary object, and the delegate class's prototype chain carries the `method_missing` / `respond_to_missing?` Proxy.
- `Symbol.iterator in rel` still answers false for an unloaded relation, by a mechanism decided in this story (for example, predications asking the relation directly).
- `Relation#clone`'s `@perf` fast path, and the `_PROXY_TARGET` symbol it reads, are deleted, since a plain instance clones through `rbObjClone`.
