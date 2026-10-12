---
title: "activerecord: a Relation round-trips Marshal (3 parked 6.1 cases)"
status: claimed
updated: 2026-10-12
rfc: "0175-activerecord-test-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 700
priority: null
pr: null
claim: "2026-10-12T18:35:41Z"
assignee: "activerecord-relation-round-trips-marshal"
blocked-by: null
closed-reason: null
---

## Context

Split from `activerecord-record-round-trips-marshal-6-1-format`. Under format
6.1 `Association#marshal_dump`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/associations/association.rb:206-209`)
writes `@association_scope` (a `Relation`, memoized at `association.rb:103-111`)
and, for a collection, `@proxy` (a `CollectionProxy`,
`collection_association.rb`, `reader`). So a record whose association was read
through its reader dumps two relations, and Rails round-trips them because
every object a `Relation` holds is a plain ivar object under a named constant.

In trails that dump raises. Measured on `Topic.find(1)` after `await
topic.replies`, and on `developers(:david)` after
`david.projects.findMostRecent()`, walking the graph `Marshal.dump` walks:

- The relation's class. `DelegateCache#initialize_relation_delegate_cache`
  (`vendor/rails/v8.0.2/activerecord/lib/active_record/relation/delegation.rb:31-42`)
  ends in `const_set mangled_name, delegate`, which
  `packages/activerecord/src/relation/delegation.ts:76-86` omits, so the
  delegate class is anonymous: `ActiveRecord::Relation can't be referred to`.
  Adding `rbModConstSet(this, mangledName, delegate)` paths it
  (`Reply::ActiveRecord_Relation`), but `Relation#inspect`
  (`packages/activerecord/src/relation.ts:418`) then prints that path where
  Rails prints `self.class.name`, which `ClassSpecificRelation::ClassMethods#name`
  (`delegation.rb:112-116`) answers with `superclass.name`. `rbModName` reads
  the class path first, so `inspect` has to dispatch `name`. Six tests in
  `relations.test.ts` and `relation.trails.test.ts` red until it does.
- Unseated classes: every `Arel` class the relation reaches (`Arel::Table`
  reads `undefined class/module Arel::`), `ActiveRecord::Relation::WhereClause`,
  `ActiveRecord::Relation::QueryAttribute`, `ActiveRecord::PredicateBuilder`
  and its `ArrayHandler`, `RelationHandler`, `RangeHandler` and
  `BasicObjectHandler`, and `ActiveRecord::TableMetadata`.
- Core classes held as values: `PredicateBuilder`'s `@handlers` keys are `Set`,
  `Array` and `BasicObject`, none of them in the path table.
- Members with no Rails counterpart: `Relation`'s `_fromLimitedIds` (a
  `WeakMap`), and `Arel::Table`'s `@type_caster` held as a JS `Map`.
- An extended relation. `extending!` extends the relation with the association
  extension module, which `Marshal.dump` writes as `TYPE_EXTENDED`
  (`vendor/ruby/v3.3.11/marshal.c:550`); `Marshal.load` does not port
  `TYPE_EXTENDED` (`packages/ruby-compat/src/marshal.ts`, "Not ported"). A
  `has_and_belongs_to_many` block extension also reaches the dump as an
  anonymous class in `@values[:extending]`
  (`can't dump anonymous module #<Class:…>`).

## Acceptance criteria

- [ ] `Marshal.load(Marshal.dump(relation))` answers a relation that loads the
      same records, for `Topic.all`, an association scope and a
      `CollectionProxy`, with every class it reaches seated under its Ruby
      path by `rbModConstSet` and every member with no Rails counterpart
      converged away.
- [ ] `initializeRelationDelegateCache` makes Rails' `const_set`, and
      `Relation#inspect` still prints `ActiveRecord::Relation`.
- [ ] `Marshal.load` reads `TYPE_EXTENDED`.
- [ ] "rails 6 1 rountrip" (`marshal_serialization_test.rb:60-70`),
      "marshalling extensions" and "marshalling named extensions"
      (`associations/extension_test.rb:46-65`) are live with Rails' bodies.
