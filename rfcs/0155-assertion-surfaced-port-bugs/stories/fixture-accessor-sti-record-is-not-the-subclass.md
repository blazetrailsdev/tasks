---
title: "Fixture accessor returns a non-STI record where Rails' Fixture#find instantiates the subclass"
status: ready
updated: 2026-09-25
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by trails#8076 (record-equality matcher). In `has-many-through-associations.test.ts` › "has many through with default scope on the target", comparing `(michael as any).firstPosts` against `[posts("thinking")]` under the suite-wide `Core#==` tester failed. The loaded record was a `SpecialPost` whose attributes include `type: "SpecialPost"`. The fixture accessor's `posts("thinking")` was a record of a different class, and its attribute JSON had no `type` key. `Core#==` (`activerecord/lib/active_record/core.rb:631-636`) requires `instance_of?(self.class)`, so the two compared unequal.

In Rails the fixture accessor goes through `ActiveRecord::Fixture#find` (`activerecord/lib/active_record/fixtures.rb:836-845`): `model_class.unscoped { model_class.find_by!(pk_clauses) }`. `find_by!` instantiates through STI (`inheritance.rb` `instantiate_instance_of` / `discriminate_class_for_record`), so `posts(:thinking)` is a `SpecialPost` with its `type` attribute. trails' `Fixture#find` (`packages/activerecord/src/fixtures.ts:425-434`) calls `findByBang` too, but the record the accessor returned (`TestFixtures#accessFixture`, `packages/activerecord/src/test-fixtures.ts:466-490`) evidently was not the STI-instantiated one. The root cause (which `Post` model / column set the record came from) is not yet established.

That test itself compares ids in Rails (`has_many_through_associations_test.rb:1381,1384`), so it stays as is. The divergence is in the fixture accessor.

## Acceptance criteria

- `posts("thinking")` returns an instance of `SpecialPost` whose attributes include `type`, as Rails' `posts(:thinking)` does.
- A regression test fails on baseline: `expect(posts("thinking")).toBeInstanceOf(SpecialPost)` plus `expect(posts("thinking")).toEqual(await Post.find(posts("thinking").id))` under the `Core#==` tester.
