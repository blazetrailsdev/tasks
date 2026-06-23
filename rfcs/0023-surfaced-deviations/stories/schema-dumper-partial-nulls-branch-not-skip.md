---
title: "Branch schema-dump partial-index/nulls-not-distinct assertions instead of skipping"
status: in-progress
updated: 2026-06-23
rfc: "0023-surfaced-deviations"
cluster: rails-deviation
deps: []
deps-rfc: []
est-loc: 90
priority: 40
pr: 3940
claim: "2026-06-23T00:27:22Z"
assignee: "schema-dumper-partial-nulls-branch-not-skip"
blocked-by: null
---

## Context

`packages/activerecord/src/schema-dumper.test.ts` ports
`test_schema_dumps_partial_indices` and `test_schema_dumps_nulls_not_distinct`
but only asserts the **supported** form and **skips** unsupported backends
(gated on `adapterSupports("partial_index")` / `adapterSupports("nulls_not_distinct")`).

Rails runs both **unconditionally** and **branches** the expected dump:

```ruby
if ActiveRecord::Base.lease_connection.supports_partial_index?
  assert_equal 't.index ["firm_id","type"], name: "company_partial_index", where: "(rating > 10)"', index_definition
else
  assert_equal 't.index ["firm_id","type"], name: "company_partial_index"', index_definition
end
```

So on MySQL (no partial index) / non-PG-15 (no nulls_not_distinct) Rails still
asserts the index dumps **without** the `where:` / `nulls_not_distinct:` option.
Our skip loses that negative-form coverage. (The current TS bodies also build
bespoke `users` indexes rather than dumping the canonical `companies` fixture
indices Rails uses — converge to the canonical fixture while branching.)

## Acceptance criteria

- [ ] Both tests run on all adapters and branch the expected dump on
      `adapterSupports("partial_index")` / `adapterSupports("nulls_not_distinct")`,
      asserting the option-less index line on unsupported backends.
- [ ] Drive the assertion off the canonical `companies` indices Rails dumps
      (drop the bespoke `users` index setup) where feasible.
- [ ] `test:compare --package activerecord --gates` stays at 0 over-gated for
      schema-dumper.test.ts.
