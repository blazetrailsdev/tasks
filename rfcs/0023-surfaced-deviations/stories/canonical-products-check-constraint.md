---
title: "Give canonical products its check constraint so the dumper case rides it"
status: draft
updated: 2026-08-27
rfc: "0023-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' canonical test schema adds a check constraint to `products`:
`vendor/rails/activerecord/test/schema/schema.rb:1020`

```ruby
add_check_constraint :products, "price > discounted_price", name: "products_price_check"
```

`schema_dumper_test.rb:222-229` (`test_schema_dumps_check_constraints`) therefore
creates nothing — it dumps the canonical `products` and greps the dumped
`t.check_constraint ... products_price_check` line.

trails' canonical loader (`packages/activerecord/src/test-helpers/test-schema.ts`,
`products` at :1351) has no way to express a check constraint, so the trails port
of that case (PR #7126, `packages/activerecord/src/schema-dumper.test.ts`) has to
build its own table — now named `dump_check_constraints` so it stops reshaping the
canonical `products` on the shared worker DB (that reshaping was the
`rebuildCanonicalTables` shield RFC 0079 just removed).

## Converged shape

Teach the canonical schema (`test-schema.ts` + `support/canonical-schema.ts`)
check constraints, mirroring `schema.rb:1020`, so canonical `products` carries
`products_price_check` on every adapter; then delete the bespoke
`dump_check_constraints` table from `schema-dumper.test.ts` and have the case dump
canonical `products`, exactly as `schema_dumper_test.rb:222-229` does.

Note check constraints are adapter-gated in Rails
(`ActiveRecord::Base.lease_connection.supports_check_constraints?`,
schema_dumper_test.rb:221) — the loader arm must skip them where unsupported, and
the trails case already rides `itIfSupports("check_constraints", ...)`.

## Acceptance criteria

- Canonical `products` carries the `products_price_check` check constraint per
  `schema.rb:1020`, on every adapter that supports check constraints.
- `schema dumps check constraints` in `schema-dumper.test.ts` dumps canonical
  `products` and creates no table of its own; `dump_check_constraints` is gone
  from the file and from its `afterAll` drop list.
- No test renames; suites green on sqlite + PG + MySQL/MariaDB.
