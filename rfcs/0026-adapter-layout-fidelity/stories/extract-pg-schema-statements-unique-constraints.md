---
title: "Extract PG unique-constraint statements into PostgreSQLSchemaStatements"
status: draft
updated: 2026-06-15
rfc: "0026-adapter-layout-fidelity"
cluster: adapter-layout
deps: ["extract-pg-schema-statements-constraints"]
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Follow-up slice carved out of `extract-pg-schema-statements-constraints`. That
story moved the **exclusion** + **check** constraint methods into
`PostgreSQLSchemaStatements`; the **unique-constraint** family was deferred to
keep the PR under the 500 LOC ceiling (pure code motion counts double).

The unique-constraint methods still inline in
`packages/activerecord/src/connection-adapters/postgresql-adapter.ts`:
`uniqueConstraintOptions`, `addUniqueConstraint`, `removeUniqueConstraint`,
`uniqueConstraints`, `uniqueConstraintName`, `uniqueConstraintFor`,
`uniqueConstraintForBang`.

This story is pure code motion: move that group into
`PostgreSQLSchemaStatements` (mirroring Rails' `postgresql/schema_statements.rb`)
using the `this.pg.*` host-accessor pattern already established for the
exclusion/check methods, leaving the adapter delegating via
`pgSchemaStatements()`. Note several of these (`uniqueConstraintName`,
`uniqueConstraintForBang`) are called directly on the adapter in
`postgresql/schema-statements.test.ts`, so the adapter must retain thin
delegating wrappers for them.

Depends on `extract-pg-schema-statements-constraints` (PR #3356) merging first
to avoid file-overlap conflicts.

## Acceptance criteria

- [ ] Listed methods live in the mirrored module file; the adapter only delegates.
- [ ] No behavior change: no test edits beyond import paths; CI green on all three adapters.
- [ ] PR diff under the 500 LOC ceiling.
