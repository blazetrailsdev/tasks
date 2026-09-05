---
title: "relocate-fixture-error-to-fixtures-ts"
status: draft
updated: 2026-09-05
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`build_fixture_sql` raises `ActiveRecord::Fixture::FixtureError`
(`vendor/rails/activerecord/lib/active_record/fixtures.rb:809,614-616`) for an
unknown fixture column. PR for `build-fixture-sql-inlines-default-insert-value`
added that arm, but could not put the class in its Rails file:
`packages/activerecord/src/fixtures.ts` already imports
`connection-adapters/abstract/database-statements.js` (fixtures.ts:1-4), so the
reverse import closes a cycle through `base.ts` and throws
`ReferenceError: Cannot access '_base' before initialization` at
`database-statements.ts:101` (`_registerBase`, reached from `base.ts:1765`).
Verified by running the trails suite with the import in place.

The class therefore lives in `packages/activerecord/src/errors.ts`, re-exported
from `fixtures.ts`, and carries
`@noRailsEquivalent CONVERGEABLE relocate-fixture-error-to-fixtures-ts`.

## Acceptance criteria

- [ ] `FixtureError` is declared in `packages/activerecord/src/fixtures.ts`, at
      its Rails path, with the `@noRailsEquivalent` receipt deleted.
- [ ] The `errors.ts` declaration and the `fixtures.ts` re-export are gone.
- [ ] `database-statements.ts` reaches it without reintroducing the
      `fixtures.ts` → `database-statements.ts` cycle.
