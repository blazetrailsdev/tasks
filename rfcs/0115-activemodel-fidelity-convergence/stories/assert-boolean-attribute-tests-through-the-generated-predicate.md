---
title: "Assert the five boolean-attribute tests through the generated `approved?` predicate, restoring Rails' string-assignment arms"
status: claimed
updated: 2026-08-28
rfc: "0115-activemodel-fidelity-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 140
priority: null
pr: null
claim: "2026-08-28T17:49:38Z"
assignee: "assert-boolean-attribute-tests-through-the-generated-predicate"
blocked-by: null
closed-reason: null
---

## Context

Five ported tests in `packages/activerecord/src/attribute-methods.test.ts`
assert around the boolean-predicate reader instead of through it, because until
PR #7170 trails registered no `?` attribute-method pattern and so had no
`approved?` to call. The pattern is now live (Query's `included do`,
`vendor/rails/activerecord/lib/active_record/attribute_methods/query.rb:9-11`),
so the ports can say what Rails says.

Rails, `vendor/rails/activerecord/test/cases/attribute_methods_test.rb`:

- `:169-172` "boolean attributes" — `assert_not_predicate Topic.find(1), :approved?`
  / `assert_predicate Topic.find(2), :approved?`. trails (`:33-41`) builds a
  bespoke `Post` with `this.attribute("published", "boolean")` and asserts
  `p.published`.
- `:446-452` "read_attribute when false" — assigns `false` then `"false"`,
  asserting `topic.approved?` after each. trails (`:817-821`) constructs
  `new Topic({ approved: false })` once and asserts
  `t.readAttribute("approved")`; the string-assignment arm is dropped.
- `:455-461` "read_attribute when true" — the `true` / `"true"` twin. trails
  (`:823-827`) has the same single-arm shape.
- `:464-477` "boolean attributes writing and reading" — four assignments
  (`"false"`, `"false"`, `"true"`, `"true"`) each asserted through `approved?`,
  no persistence. trails (`:862-869`) does a `create` / `save` / `find`
  roundtrip asserting `found.approved`, which tests a different thing.
- `:837-843` trails' "boolean attribute predicate" asserts `t.approved`.

The dropped string arms are the substance: they are what prove the boolean
type casts `"false"` to false, and asserting the raw attribute instead of the
predicate cannot distinguish that.

## Converged shape

Each test asserts through the generated predicate — `topic["approved?"]`, which
is an accessor property in trails, not a call (CLAUDE.md, "Generated attribute
readers are properties") — and restores the assignment arms Rails makes, in
Rails' order. `boolean attributes` uses the canonical `topics` fixtures
(`Topic.find(1)` / `Topic.find(2)`) rather than a bespoke `Post`, per CLAUDE.md's
canonical-tables rule.

Do NOT rename any of the five tests; `parity:test` matches on the names.

## Acceptance criteria

- [ ] All five tests assert through the generated `approved?` / `published?`
      predicate property.
- [ ] The `"false"` / `"true"` string-assignment arms Rails makes are restored
      in "read_attribute when false", "read_attribute when true", and "boolean
      attributes writing and reading", in Rails' order.
- [ ] "boolean attributes" uses the canonical `topics` fixtures rather than a
      bespoke model.
- [ ] `pnpm parity:test:assertions` delta is non-negative.
- [ ] activerecord suite green on all three adapter lanes.
