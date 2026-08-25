---
title: "Two ArgumentError classes for Ruby's one, so instanceof is false across packages"
status: draft
updated: 2026-08-06
rfc: "0111-error-class-message-parity"
cluster: duplicate-error-classes
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Ruby has one `ArgumentError`. trails has at least two unrelated TS classes for
it, so `instanceof` is false across the package boundary:

- `packages/date/src/date.ts:205` — `export class ArgumentError extends Error`,
  the one `Date::Error` (`:2363`) extends and `Date.parse` raises.
- `packages/activemodel/src/attribute-assignment.ts:247` —
  `class ArgumentError extends globalThis.Error`, which
  `Type::DateTime#value_from_multiparameter_assignment` raises.

Surfaced by PR #6151: `packages/activemodel/src/type/date-time.ts` now names
both in one file and had to import the date one as `RubyArgumentError` to do it.
Worse, `fallback_string_to_date` / `fallback_string_to_time` port Rails'
`rescue ArgumentError` (`activemodel/lib/active_model/type/date.rb:59-61`,
`date_time.rb:67-70`) as `instanceof RubyArgumentError` — correct today only
because the thrown one happens to come from the date package. A caller that
raised activemodel's `ArgumentError` through the same path would escape the
rescue that Ruby catches.

Both are `name`-stamped `"ArgumentError"`, so message-level assertions pass and
the split is invisible to tests.

## Converged shape

One `ArgumentError` class for Ruby's one, in the package every raiser can
already reach, with the others importing it. `@blazetrails/activesupport` is the
likely home — `packages/date` deliberately has no runtime dependencies beyond
the Temporal polyfill, so check that constraint before choosing, and prefer
moving the class over adding a date → activesupport edge.

Grep for other spellings before landing: this story is scoped to Ruby's
`ArgumentError`, but the same duplication may exist for other Ruby core error
classes.

## Acceptance criteria

- [ ] One TS class for Ruby's `ArgumentError`; the duplicate definitions are
      deleted, not aliased.
- [ ] `Date::Error` still extends it and `Date.parse` still raises through it.
- [ ] `packages/activemodel/src/type/date.ts` / `date-time.ts` / `time.ts` drop
      the `RubyArgumentError` import alias.
- [ ] A test asserts the cross-package `instanceof` that is false today.

## Absorbed: `two-argumenterror-classes-break-instanceof`

Merged in during the RFC 0023 triage pass (2026-08-18). Original title: "activemodel and activesupport define separate ArgumentError classes, breaking instanceof"

### Context

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

### Converged shape

- One `ArgumentError` class for the whole repo, defined where Ruby's core
  error analogues already live, re-exported by the other packages.
- `instanceof ArgumentError` holds for every raise site regardless of which
  package threw.
- `invalid-options.test.ts` switches back to `rejects.toThrow(ArgumentError)`.

### Acceptance criteria

- [ ] `@blazetrails/activesupport` and `@blazetrails/activemodel` export the
      same `ArgumentError` identity.
- [ ] No test asserts on `err.name` where `instanceof` is what Rails asserts.

## Re-homed from `0023-surfaced-deviations` (2026-08-18)

Moved by the RFC 0023 backlog triage pass into `0111-error-class-message-parity`, which was carved out
of that register for this deviation class. Nothing about the finding changed —
every Rails and trails `file:line` citation above is as originally filed.
