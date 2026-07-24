---
title: "Converge 'group by summed field through association and having' — test body has no .having()"
status: ready
updated: 2026-07-24
rfc: "0030-ar-test-compare-residual-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 15
priority: 20
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced while porting `grouped-calculation-having-dropped` (PR #5184).

`packages/activerecord/src/calculations.test.ts` "should group by summed field
through association and having" is a verbatim duplicate of the test above it,
"should group by scoped field" — it has **no `.having(...)` call at all**, so
despite its name it never exercised the HAVING path that #5184 fixed:

```ts
it("should group by summed field through association and having", async () => {
  const c = (await firm.companies.group("name").sum("id")) as Map<unknown, number>;
  expect(Number(c.get("Leetsoft"))).toBe(7);
  expect(Number(c.get("Jadedpixel"))).toBe(8);
});
```

Rails' `test_should_group_by_summed_field_through_association_and_having`
(`vendor/rails/activerecord/test/cases/calculations_test.rb:600-604`) does have
the clause, and asserts the filtered group is ABSENT:

```ruby
c = companies(:rails_core).companies.group(:name).having("sum(id) > 7").sum(:id)
assert_nil      c["Leetsoft"]
assert_equal 8, c["Jadedpixel"]
```

Same weak-assertion / dropped-clause shape that #5172 and #5184 fixed elsewhere.
Because the grouped HAVING emitter landed in #5184, converging this test should
pass without implementation changes — but it must be verified, since the
relation here is an association scope (`firm.companies`), which reaches
`groupedAggregate` through a different spawn path than the `Account.group(...)`
tests.

Note for whoever picks this up: `rg` for the prose test name misses these —
search the underscored Rails method name (`rg -n
"test_should_group_by_summed_field_through_association_and_having"`) or use
`pnpm rails:find`.

## Acceptance criteria

- The test body matches Rails: `.having("sum(id) > 7")`, `c["Leetsoft"]` absent,
  `c["Jadedpixel"]` == 8.
- Test name unchanged (it is already Rails-correct; the BODY is what diverged).
- Confirm whether it passes on current `main` post-#5184; if it does not, fix the
  association-scope spawn path that drops the having clause.
