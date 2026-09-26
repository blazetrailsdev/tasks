---
title: "relation-enumerable-array-delegates"
status: draft
updated: 2026-09-26
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

Rails' `ActiveRecord::Relation` does `include Enumerable`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/relation.rb:67`), so every
`ActiveRecord::DelegationTests::ARRAY_DELEGATES` name
(`vendor/rails/v8.0.2/activerecord/test/cases/relation/delegation_test.rb:10-24`)
answers `respond_to?` on a relation and a `CollectionProxy`. trails'
`Relation` cherry-picks enumerable members (`packages/activerecord/src/relation.ts`,
`detect` / `reject` / `sortBy` / `groupBy` over `ENUMERABLE_DELEGATES`), and the
port of that loop (`packages/activerecord/src/relation/delegation.test.ts`,
`DelegationAssociationTest`) parks these as `it.skip` under
`RELATION_ENUMERABLE_GAPS`:

`all?` (`isAll`), `collect`, `each_cons` (`eachCons`), `each_with_index`
(`eachWithIndex`), `exclude?` (`isExclude`), `find_all` (`findAll`),
`to_set` (`toSet`), `to_yaml` (`toYaml`).

`Relation` also lacks `include?` (`isInclude`), which `CollectionProxy` has.

## Acceptance criteria

- `Relation` (and so `CollectionProxy`) answers each name above, loading
  records the way the existing enumerable delegates do.
- The `RELATION_ENUMERABLE_GAPS` list and its `it.skip` loop in
  `delegation.test.ts` are deleted; `relation/delegation_test.rb` has 0 skipped.
