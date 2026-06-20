---
title: "converge-schema-dumper-partial-nulls-overgate"
status: ready
updated: 2026-06-20
rfc: "0032-ar-gate-fidelity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

PR #3715 (story `gate-missing-insert-all`) taught the test:compare gate
extractor (`scripts/test-compare/gates.ts` `gateFromGuardExpr`) to recognize
`adapterSupports("feature")` calls inside `skipIf`/`runIf` guard expressions and
emit them as features (polarity-blind, mirroring the Ruby extractor's
`scan_run_condition`). This surfaced two previously-hidden **over-gated**
mismatches in `packages/activerecord/src/schema-dumper.test.ts`:

- `schema dumps partial indices` (line ~206) —
  `it.skipIf(!adapterSupports("partial_index"))`
- `schema dumps nulls not distinct` (line ~220) —
  `it.skipIf(!adapterSupports("nulls_not_distinct"))`

Rails does **not** skip these. It runs them on every adapter and branches the
_expected value_ inside the body
(`vendor/rails/activerecord/test/cases/schema_dumper_test.rb:185-200`):

```ruby
def test_schema_dumps_partial_indices
  index_definition = dump_table_schema("companies")...
  if ActiveRecord::Base.lease_connection.supports_partial_index?
    assert_equal 't.index ["firm_id", "type"], name: "company_partial_index", where: "(rating > 10)"', index_definition
  else
    assert_equal 't.index ["firm_id", "type"], name: "company_partial_index"', index_definition
  end
end
```

The TS port instead skips the whole test on MySQL, which is an over-gate
(classifyGateMismatch → `over-gated`).

## Acceptance criteria

- [ ] Converge both tests to Rails: run unconditionally (drop the `skipIf`),
      and branch the expected dumped-index string on
      `adapterSupports("partial_index")` / `adapterSupports("nulls_not_distinct")`
      (mirror the Rails `if/else`), so the MySQL lane asserts the plain index.
- [ ] Verify the MySQL schema dumper actually emits the plain index (no `where:`
      / `nulls_not_distinct:`) on MySQL; fix the dumper if it diverges.
- [ ] `test:compare --package activerecord --gates` reports 0 `over-gated` for
      these two tests in `schema-dumper.test.ts`.
- [ ] Test names unchanged. No stubs.
