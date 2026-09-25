---
title: "nested-through: read public accessors, not association(...).target, in the 3 preload tests this story skipped"
status: done
updated: 2026-09-25
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: trails#8075
claim: "2026-09-25T01:44:13Z"
assignee: "nested-through-polymorphic-accessor-fidelity"
blocked-by: null
closed-reason: null
---

## Context

Discovered while converging `nested_through_associations_test.rb` assertion
parity (trails#7863, story `assertions-habtm-and-nested-through`). Three
tests in `packages/activerecord/src/associations/nested-through-associations.test.ts`
were out of that story's scope (their assertion counts/kinds already matched
Rails, so `parity:test --assertions` doesn't flag them) but still read the
association's internal `.target` instead of calling the public accessor Rails
itself calls — the same class of deviation trails#7863's review caught and
fixed for the tests that story did touch (see
`nested_through_associations_test.rb:103-108` for the pattern the review
cited).

Rails source and the trails divergence:

- `test_polymorphic_has_many_through_when_through_association_has_not_loaded`
  (`vendor/rails/activerecord/test/cases/associations/nested_through_associations_test.rb:611-619`):
  `assert_equal [cake_designer], hotel.cake_designers` /
  `assert_equal [drink_designer], hotel.drink_designers` — calls the public
  `cake_designers`/`drink_designers` accessors. Trails
  (`packages/activerecord/src/associations/nested-through-associations.test.ts`,
  `it("polymorphic has many through when through association has not loaded", ...)`)
  instead reads
  `(hotel.association("cakeDesigners").target ?? []) as any[]` /
  `(hotel.association("drinkDesigners").target ?? []) as any[]`.
- `test_polymorphic_has_many_through_when_through_association_has_already_loaded`
  (`nested_through_associations_test.rb:622-631`): same pattern, same
  `hotel.cake_designers` / `hotel.drink_designers` accessor calls Rails-side;
  same `.association(...).target` reads on the trails side.
- `test_has_many_through_reset_source_reflection_after_loading_is_complete`
  (`nested_through_associations_test.rb:655-659`):
  `assert_equal original.ordered_post_comments.ids, preloaded.ordered_post_comments.ids`
  — Rails calls the public `ordered_post_comments` accessor (then `.ids`) on
  both records. Trails reads
  `(preloaded.association("orderedPostComments").target ?? []) as any[]`
  for the preloaded side instead of `await preloaded.orderedPostComments`.

## Converged shape

For each of the three tests, replace the `association(name).target` read with
the public association accessor (`hotel.cakeDesigners`, `hotel.drinkDesigners`,
`preloaded.orderedPostComments`), awaited, and compare via record identity
(class + id) rather than `.id`-only mapping — the same `recordKey`-style
comparison trails#7863 settled on for
`packages/activerecord/src/associations/nested-through-associations.test.ts`'s
other preload tests, to keep a same-id-wrong-class regression from passing
silently. Drop the `as any` casts once the accessor is called directly (the
accessor is typed).

## Acceptance criteria

- All three tests above call the public association accessor Rails calls,
  not `association(...).target`.
- `pnpm parity:test -- --package activerecord --assertions` stays 0/0/0 for
  `nested_through_associations_test.rb` (no regression — these three tests
  already report clean counts/kinds; only the accessor-vs-target shape
  changes).
- No test name changes.
