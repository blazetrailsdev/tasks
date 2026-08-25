---
title: "activemodel and activesupport define separate ArgumentError classes, breaking instanceof"
status: closed
updated: 2026-08-18
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "merged into two-argumenterror-classes-for-rubys-one — duplicate story describing the same deviation; the surviving body carries both sets of Rails and trails file:line citations"
---

## Context

Ruby has exactly one `ArgumentError`; trails has at least two unrelated
classes with that name — `packages/activemodel`'s (exported as
`ArgumentError` from `@blazetrails/activemodel`) and
`packages/activesupport/src/hash-utils.ts:13`, which `assertValidKeys` raises.
Neither is an instance of the other, so `instanceof` narrowing silently fails
across the package boundary while `err.name === "ArgumentError"` still passes.

Surfaced by PR #6066: `SchemaStatements#validateCreateTableOptionsBang`
(packages/activerecord/src/connection-adapters/abstract/schema-statements.ts)
now routes through `assertValidKeys`, mirroring
vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/schema_statements.rb:1709-1714,
so it raises activesupport's class where the surrounding file raises
activemodel's. The ported test
(packages/activerecord/src/migration/invalid-options.test.ts) had to assert
`exception.name === "ArgumentError"` instead of the repo-standard
`rejects.toThrow(ArgumentError)` — Rails' `assert_raises(ArgumentError)`
(vendor/rails/activerecord/test/cases/migration/invalid_options_test.rb:114)
has no such caveat.

## Converged shape

- One `ArgumentError` class for the whole repo, defined where Ruby's core
  error analogues already live, re-exported by the other packages.
- `instanceof ArgumentError` holds for every raise site regardless of which
  package threw.
- `invalid-options.test.ts` switches back to `rejects.toThrow(ArgumentError)`.

## Acceptance criteria

- [ ] `@blazetrails/activesupport` and `@blazetrails/activemodel` export the
      same `ArgumentError` identity.
- [ ] No test asserts on `err.name` where `instanceof` is what Rails asserts.
