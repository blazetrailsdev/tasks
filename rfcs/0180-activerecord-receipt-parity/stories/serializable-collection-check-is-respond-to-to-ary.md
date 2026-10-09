---
title: "activemodel: serializable_hash's collection check is three arms where Rails asks respond_to?(:to_ary)"
status: ready
updated: 2026-10-09
rfc: "0180-activerecord-receipt-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActiveModel::Serialization#serializable_hash` tells a collection from a single record with `records.respond_to?(:to_ary)` (`vendor/rails/v8.0.2/activemodel/lib/active_model/serialization.rb:141-145`).

`to_ary` is not ported by name (`SKIP_GROUPS`, `scripts/parity/conventions.ts`), and trails' stand-in is the module-private `isSerializableCollection` (`packages/activemodel/src/serialization.ts`): an Array, or an object that is not a record and answers `Symbol.iterator`. trails#8695 added a second arm, an object answering `toArray`, because an unloaded `CollectionProxy` no longer answers `Symbol.iterator`.

So the check has three arms where Rails has one predicate, and the iterator arm accepts any iterable (a `Set`, a `Map`), which Rails would send `serializable_hash` to and raise `NoMethodError`.

The same function gates `preloadIncludes` and `resolveIncludeAsync`, which read `loaded` / `load` off the collection.

## Acceptance criteria

- [ ] `isSerializableCollection` is one check that answers what `respond_to?(:to_ary)` answers: true for an Array, a `Relation` and a `CollectionProxy` (loaded or not), false for a record and for an iterable that is not array-like.
- [ ] `json-serialization.test.ts` "raises when including an unloaded has_many (sync serialization cannot query)" stays green.
- [ ] An `include:` naming a method that returns a `Set` raises `NoMethodError`, as `serialization.rb:144` does.
