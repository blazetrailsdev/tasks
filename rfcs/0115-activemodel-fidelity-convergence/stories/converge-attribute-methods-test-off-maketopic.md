---
title: "Converge AttributeMethodsTest's first describe off makeTopic onto canonical topics fixtures"
status: ready
updated: 2026-08-28
rfc: "0115-activemodel-fidelity-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 300
priority: 14
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`AttributeMethodsTest` in `vendor/rails/activerecord/test/cases/attribute_methods_test.rb`
declares `fixtures :topics, :developers, :computers, :companies, ...` (`:14`) and
its tests read the canonical `Topic` model and `topics(:first)` rows.

trails' `packages/activerecord/src/attribute-methods.test.ts` builds two bespoke
stand-ins instead — `makeTopic()` (`:763-774`), a `Base` subclass declaring five
attributes, and `makeModel()`'s `Post` — and asserts against them. CLAUDE.md's
canonical-tables rule says the opposite: canonical schema, canonical models,
canonical fixtures.

PR #7176 converged the five boolean-attribute tests off `makeTopic()` onto
`CanonicalTopic` plus real `topics` fixtures, in a sibling
`describe("AttributeMethodsTest")` of its own. That left the first describe
still on `fixtures([])` and `makeTopic()`, and eight of its tests are the
reason: their Rails counterparts use fixtures but their trails bodies call no
fixture accessor, so arming `test-fixture-parity` over the first describe would
red them. The eight, by their Rails names:

`attribute_for_inspect with an array`, `attribute_for_inspect with a date`,
`attribute_for_inspect with a long array`,
`attribute_for_inspect with a non-primary key id attribute`,
`attribute_for_inspect with a string`, `set attributes`,
`on_the_fly_super_invokable_generated_attribute_methods_via_method_missing`,
`on-the-fly super-invokable generated attribute predicates via method_missing`.

Several are placeholder-shaped — `await Post.create({ title: "inspect_date" })`
then `expect(p.id).toBeDefined()` — where Rails asserts a specific
`attribute_for_inspect` string off a fixture row.

## Converged shape

The first `describe("AttributeMethodsTest")` takes
`const { topics } = fixtures(["topics", ...])` and its tests read the canonical
models and fixture rows their Rails counterparts read, asserting what Rails
asserts. `makeTopic()` and the bespoke `Post` go away with their last caller,
and the two describes collapse back into one.

Do NOT rename any test; `parity:test` matches on the names.

## Acceptance criteria

- [ ] `makeTopic()` is deleted; the tests that used it read `CanonicalTopic`.
- [ ] The eight tests above assert against canonical fixture rows, matching
      their Rails counterparts' assertions rather than `toBeDefined()`.
- [ ] `test-fixture-parity` is clean with the describe armed (a non-empty
      destructured `fixtures([...])` call).
- [ ] `pnpm parity:test:assertions` delta non-negative; activerecord suite green
      on all three lanes.
