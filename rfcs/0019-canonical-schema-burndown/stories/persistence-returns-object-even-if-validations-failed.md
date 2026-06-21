---
title: "persistence-returns-object-even-if-validations-failed"
status: in-progress
updated: 2026-06-21
rfc: "0019-canonical-schema-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 3822
claim: "2026-06-21T19:02:41Z"
assignee: "persistence-returns-object-even-if-validations-failed"
blocked-by: null
---

## Context

PR #3817 (persistence-test-canonical-wave6) deleted a bespoke deviation test
named `returns object even if validations failed` from
`packages/activerecord/src/persistence.test.ts`. Its name coincidentally
normalizes to the real Rails test
`test_returns_object_even_if_validations_failed`
(`vendor/rails/activerecord/test/cases/persistence_test.rb:197-199`), but the
deleted test asserted different behavior (`Post.create({})` + `errors`), so it
was removed as a deviation — costing one matched name in test:compare.

The real Rails test asserts that the class-level updater returns every record in
scope even when a validation fails:

```ruby
def test_returns_object_even_if_validations_failed
  assert_equal Developer.all.to_a, Developer.update(salary: 1_000_000)
end
```

## Acceptance criteria

- [ ] Add a canonical test named `returns object even if validations failed`
      riding the canonical `Developer` model + fixtures that mirrors
      `Developer.update(salary: 1_000_000)` returning `Developer.all.to_a`
      (all records returned even though the update would fail validations).
- [ ] `pnpm vitest run packages/activerecord/src/persistence.test.ts` passes;
      `pnpm lint` and `node scripts/typecheck.mjs` clean.
- [ ] Restores the test:compare matched name lost in PR #3817.
