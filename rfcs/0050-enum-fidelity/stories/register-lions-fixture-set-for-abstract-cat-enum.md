---
title: "Register a lions fixture set so canonical Cat/Lion abstract-parent enum tests work"
status: ready
updated: 2026-07-09
rfc: "0050-enum-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Discovered during inherited-enum-decorator-replays-into-subclass-materialization
(PR #4814). The canonical `Cat` (abstract, `enum :gender`) / `Lion`
(`lions.gender`, `lions.is_vegetarian`) models are the exact
abstract-parent-enum-into-concrete-subclass example named in that story's
acceptance criteria, but there is no `lions` fixture set in
`packages/activerecord/src/test-helpers/fixtures-registry.ts`. So
`fixtures(["lions"])` throws `no fixture set named "lions"`, and
`rebuildCanonicalTables(["lions"])` alone does not wire the connection handler
(`ConnectionNotDefined`). PR #4814 therefore had to test the predicate /
materialization fix with synthetic classes on the canonical `books` table
(`books.nullable_status`) instead of the literal `Lion < Cat` models.

The `lions` table itself is already canonical:
`test-helpers/test-schema.ts:922` (gender + is_vegetarian) and
`test-helpers/canonical-schema.ts:999` both define it, mirroring
`vendor/rails/activerecord/test/schema/schema.rb:740`. Only the fixture-set
registration is missing.

Relevant code:

- `packages/activerecord/src/test-helpers/fixtures-registry.ts` — add a `lions`
  entry (model: `Lion`, register `Cat` alongside for the abstract parent /
  default scope). Mirror Rails' `test/fixtures/` — Rails has no `lions.yml`, so
  an empty/minimal data set matching how `dogs` is registered is fine.
- `packages/activerecord/src/test-helpers/models/cat.ts` — `Cat`/`Lion`.

## Acceptance criteria

- `fixtures(["lions"])` resolves and wires the connection handler so a test can
  `new Lion({ gender: "female" })` and call `isFemale()` / persist without
  `TableNotSpecified` or `ConnectionNotDefined`.
- A regression test using the real `Lion < abstract Cat` models covers the
  inherited-enum predicate path fixed in PR #4814 (currently only covered via
  synthetic `books`-backed classes).
- Cat's `default_scope { where(is_vegetarian: false) }` scope-for-create still
  materializes cleanly on `new Lion`.
