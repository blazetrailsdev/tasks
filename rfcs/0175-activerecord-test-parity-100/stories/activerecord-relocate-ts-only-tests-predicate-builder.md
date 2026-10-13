---
title: "activerecord: move the 25 TS-only tests in relation/predicate-builder.test.ts to its .trails sibling"
status: done
updated: 2026-10-13
rfc: "0175-activerecord-test-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 590
priority: null
pr: trails#8847
claim: "2026-10-13T09:12:28Z"
assignee: "activerecord-relocate-ts-only-tests-predicate-builder"
blocked-by: null
closed-reason: null
---

## Context

Split out of `activerecord-relocate-ts-only-tests-relation`, which moved the
`with`, `merging`, `mutation` and `where` extras but could not fit this file
under the PR LOC ceiling (the move alone is about 590 changed lines).

`packages/activerecord/src/relation/predicate-builder.test.ts` holds 6 Rails
tests (`vendor/rails/v8.0.2/activerecord/test/cases/relation/predicate_builder_test.rb`)
and 25 TS-only tests, all inside four nested describes at the end of
`PredicateBuilderTest`:

- `buildFromHash` (11 tests)
- `buildNegatedFromHash` (6 tests)
- `QueryAttribute bind handling` (4 tests)
- `nested table-keyed hash expansion` (4 tests)

`predicate-builder.trails.test.ts` already exists and already has its own
`compileWithBinds`.

What the move needs, found while doing it once:

- The module-level `VALUE_TYPE`, `fakePgCaster` and `castedTable` helpers are
  used only by the four describes and move with them. `compileWithBinds` in the
  Rails-named file becomes unused and is deleted.
- The destination describe needs `fixtures(["topics", "posts", "authors", "products"])`.
- The sibling's imports gain `afterAll`, `ValueType`, `type ArelNode`, `Range`,
  `registeredConstant`, `unregisterConstant`, `WhereClause`, `Substitute`, and
  `Base` as a value import. Without the `Range` import the global DOM `Range`
  type-checks in its place and fails on arity.
- `.trails.test.ts` files are not in `eslint/no-explicit-any-test-exclude.json`,
  so the moved code cannot keep its `any` casts and the allowlist must not
  grow. `new TableMetadata(PbTestPost as any, (PbTestPost as any).arelTable)`
  type-checks with both casts removed, and `(binds[0] as any).valueBeforeTypeCast`
  takes `as { valueBeforeTypeCast: unknown }`.
- The Rails-named file then drops ten unused imports (`Table`, `Collectors`,
  `ArelNode`, `WhereClause`, `Substitute`, `TableMetadata`, `Base`, `Author`,
  `Range`, `ValueType`); `eslint --fix` removes them.

## Acceptance criteria

- [ ] The 25 tests live in `predicate-builder.trails.test.ts`, bodies unchanged apart from the `any` casts.
- [ ] `relation/predicate-builder.test.ts` reports 0 extra in `pnpm parity:test --package activerecord --sort-extra --min-extra=1`.
- [ ] No row is added to `eslint/no-explicit-any-test-exclude.json`.
