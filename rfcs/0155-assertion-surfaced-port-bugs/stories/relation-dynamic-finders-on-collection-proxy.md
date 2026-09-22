---
title: "Dynamic find_by_<attr> finders on relations and collection proxies"
status: ready
updated: 2026-09-22
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`has_many_associations_test.rb:2223-2226` (`dynamic find should respect association order for through`)
calls `authors(:david).comments_desc.find_by_type("SpecialComment")`: a dynamic finder on a
collection proxy, which Rails reaches through `Relation#method_missing` → the model's
`DynamicMatchers` (`activerecord/lib/active_record/dynamic_matchers.rb`,
`relation/delegation.rb`).

The trails port (`packages/activerecord/src/associations/has-many-associations.test.ts`) spells
it `.findBy({ type: "SpecialComment" })`, because `findByType` is not a function on a
`CollectionProxy`/`Relation`.

## Acceptance criteria

- `findBy<Attr>` dynamic finders resolve on relations and collection proxies the way they do on
  the model class, scoped to the relation.
- The test above calls `commentsDesc.findByType("SpecialComment")` as Rails does.
