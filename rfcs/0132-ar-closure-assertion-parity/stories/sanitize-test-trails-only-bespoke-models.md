---
title: "sanitize-test-trails-only-bespoke-models"
status: done
updated: 2026-09-20
rfc: "0132-ar-closure-assertion-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#7898
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/activerecord/src/sanitize.test.ts`'s trails-only
`describe("sanitizeSql")` block (and its nested
`describe("private helpers (replace_bind_variables, quote_bound_value, etc)")`)
declares 28 bespoke models inline — `class Post extends Base { static
_tableName = "posts" }` and `class User extends Base { static _tableName =
"users" }` — several of which also override `sanitizeSqlArray`, `sanitizeSql`
or `disallowRawSqlBang` statically to probe dispatch.

CLAUDE.md § Conventions ("Canonical tables only — no bespoke tables") says AR
tests use the official models in
`packages/activerecord/src/test-helpers/models/`. These predate trails#7898,
which converged the Rails-matched `describe("SanitizeTest")` in the same file
onto the canonical `Binary` / `Author` / `Post` and removed the bespoke classes
there; the trails-only block was left untouched because it is outside that
PR's diff and the PR was already over its LOC ceiling.

Two things are entangled and should be decided together:

- **Where the block lives.** It is TS-only surface, so by the repo's convention
  it belongs in a `sanitize.trails.test.ts` twin rather than beside the
  Rails-matched describes. Moving it also drops 31 rows from that file's
  `extra (TS only)` column in `pnpm parity:test --assertions`.
- **What the models are.** A test that overrides a static on its subject cannot
  use the canonical `Post` directly without leaking the override to every other
  test in the run, so the converged shape is `class <Name> extends Post` — the
  canonical table and columns, an isolated class for the override.
  `_tableName = "users"` has no canonical counterpart at all and needs a
  canonical table picked for it.

## Acceptance criteria

- The trails-only `describe("sanitizeSql")` block lives in
  `packages/activerecord/src/sanitize.trails.test.ts`.
- No `extends Base` + `static _tableName` declaration remains in either file;
  each test subject subclasses a canonical model or uses one directly.
- `pnpm parity:test -- --package activerecord --assertions` still reports
  `sanitize_test.rb` at 0 assertion mismatches.
