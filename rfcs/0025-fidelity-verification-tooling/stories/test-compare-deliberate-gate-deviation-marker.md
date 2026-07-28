---
title: "test-compare: a first-class marker for a deliberate gate deviation"
status: ready
updated: 2026-07-28
rfc: "0025-fidelity-verification-tooling"
cluster: null
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

`scripts/test-compare/gates.ts` `gateFromGuardExpr` derives a TS test's gate by
regex over the `skipIf`/`runIf` expression text. There is no way to say "this
adapter skip is a deliberate deviation Rails does not have" — `classifyGateMismatch`
would call it `over-gated`/`wrong-gate`, and `--gates --check` is a hard zero with
no baseline file.

The only way to express it today is to hide the adapter test behind an opaque
identifier so the extractor falls through to `guards: ["unknown"]`. PR #5466 did
exactly that for `remove foreign key with restrict action`
(`packages/activerecord/src/migration/foreign-key.test.ts`), where the MySQL skip
is justified — `MySQL::SchemaStatements#extract_foreign_key_action` is
`super unless specifier == "RESTRICT"`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/mysql/schema_statements.rb:224-226`),
so the fk reflects `on_delete` nil and `defined_for?` can never match, while
Rails' own `test_remove_foreign_key_with_restrict_action`
(`vendor/rails/activerecord/test/cases/migration/foreign_key_test.rb:446-451`)
carries no guard because Rails' suite does not exercise it there.

That workaround is implicit and fragile: inlining the constant (an obvious
"simplification") silently reddens CI, and the extractor records `unknown`
rather than the real reason.

## Acceptance criteria

- A first-class, greppable way to mark a deliberate gate deviation — e.g. a
  registered guard helper (`deliberateSkip("reason")` / a recognized identifier
  prefix) that `gateFromGuardExpr` maps to a named guard instead of `unknown`,
  or a reasoned exclusion file in the shape of the api-compare `*-exclude`
  baselines.
- The marker carries the justification (Rails `file:line`) so a reviewer sees
  why the gate diverges.
- `migration/foreign-key.test.ts`'s `mysqlRestrictActionReflectsNil` is
  converted to the new marker, and inlining `adapterType === "mysql"` at that
  call site no longer looks like the "obvious cleanup".
- `--gates --check` stays a hard zero for everything not explicitly marked.

## Definition of done

Marker implemented in `scripts/test-compare/gates.ts` with unit coverage, the
one existing call site migrated, `pnpm test:compare -- --gates --check` green.
