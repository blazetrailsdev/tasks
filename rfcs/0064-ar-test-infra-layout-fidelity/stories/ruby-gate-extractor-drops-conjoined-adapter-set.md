---
title: "ruby-gate-extractor-drops-conjoined-adapter-set"
status: done
updated: 2026-07-29
rfc: "0064-ar-test-infra-layout-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 5602
claim: "2026-07-29T19:58:31Z"
assignee: "ruby-gate-extractor-drops-conjoined-adapter-set"
blocked-by: null
closed-reason: null
---

## Context

`scripts/test-compare/extract-ruby-tests.rb:629-640` drops a POSITIVE adapter set
whenever the condition also carries a feature or guard predicate (`mixed`), on the
grounds that the combinator could be `&&` or `||` and the run-on set differs.
For a pure conjunction that is too conservative: `A && supports_x?` runs on
`A ∩ supports_x?`, which is expressible. The rule immediately below it already
makes exactly this argument for NEGATED adapter predicates — it emits
`base - neg_adapters` when `positive && !acc[:has_or]`.

Concrete miss, found on PR 5585. `vendor/rails/activerecord/test/cases/view_test.rb:193-197`:

```ruby
def test_insert_record_populates_primary_key
  ...
end if current_adapter?(:PostgreSQLAdapter, :SQLite3Adapter) && supports_insert_returning?
```

inside a class body guarded by
`current_adapter?(:Mysql2Adapter, :TrilogyAdapter, :PostgreSQLAdapter)`
(view_test.rb:158). The true run-on set is the intersection: PostgreSQL only.
The extractor emits `adapters=[mysql,postgresql] features=[insert_returning,views]`
— it keeps the class guard and discards the method's own adapter clause. The
faithful TS gate (`skipIf(adapterType !== "postgres")`) therefore reports as
`wrong-gate`, and matching the extractor instead would run the test on MariaDB,
where Rails never runs it and where it fails.

PR 5585 prototyped the fix and measured the real cost — do not assume it is a
one-line change. Relaxing `mixed` to keep the adapter set on a pure conjunction
(and to drop it only under `||`, or under `unless` where negating a conjunction
yields a disjunction) takes gate-mismatch from 1 to **11**: the sharper Rails
gates expose 10 pre-existing TS gates that under-restrict, e.g.

- `tasks/database-tasks.test.ts` (8) — `rails: adapters=[sqlite]
guards=[in_memory_db]` vs `ts: unconditional` / `guards=[unknown]`
- `dirty.test.ts` — "partial insert off with changed composite identity primary
  key attribute": `rails: adapters=[postgresql] features=[identity_columns]` vs
  `ts: features=[identity_columns]`
- `migration/columns.test.ts` — "change column null does not change default
  functions": `rails: adapters=[mysql] features=[default_expression]` vs
  `ts: features=[default_expression]`

Those 10 TS gates need tightening in the same change (or in companion stories
landed first), since gate-mismatch is a hard CI gate in
`Rails API/Test Comparison`. 5585 therefore left the extractor alone and kept the
narrowing out of `skipIf`: the view test rides a `mariadbStandIn` runtime guard,
which the TS extractor does not read, so the compared gate still matches Rails'
extracted `adapters=[mysql,postgresql]`. Undoing that guard is part of this
story's work.

## Acceptance criteria

- A positive adapter set survives `mixed` when the condition is a pure
  conjunction (`&&`, no `||`), intersected with any enclosing adapter guard —
  mirroring the existing negated-adapter branch's reasoning.
- `view_test.rb`'s `test_insert_record_populates_primary_key` extracts as
  `adapters=[postgresql] features=[insert_returning,views]`, clearing the
  `wrong-gate` entry PR 5585 leaves behind.
- `pnpm test:compare` gate-mismatch count does not rise for any other test:
  diff the `--gates` output before and after.
- Unit coverage in `scripts/test-compare/gate-mismatch.test.ts` for the pure-`&&`
  adapter+feature case.
