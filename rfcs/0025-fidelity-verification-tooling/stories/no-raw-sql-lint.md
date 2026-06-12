---
title: "ESLint: ban raw SQL strings outside connection-adapters/tasks (enforce the arel-only rule)"
status: claimed
updated: 2026-06-12
rfc: "0025-fidelity-verification-tooling"
cluster: lint
deps: []
deps-rfc: []
est-loc: 250
priority: 15
pr: null
claim: "2026-06-12T21:15:15Z"
assignee: "no-raw-sql-lint"
blocked-by: null
---

## Context

CONTRIBUTING.md mandates "build queries with `@blazetrails/arel` … never raw
SQL strings", and RFC 0022 exists because string-assembled SQL crept in
anyway. This story turns the prose into a rule.

New `eslint/no-raw-sql.mjs` + `no-raw-sql.test.mjs`, registered in
`eslint.config.mjs` under the `blazetrails` plugin (clone the registration
block of an existing rule, ~L106–130), scoped to
`packages/activerecord/src/**/*.ts` but **excluding**:
`**/*.test.ts`, `connection-adapters/**`, `adapters/**`, `tasks/**`,
`schema-*.ts` (dumper/migration DDL legitimately renders SQL).

Rule logic (keep it simple and high-precision):

- Flag a string literal or template literal whose text matches
  `/^\s*(SELECT|INSERT|UPDATE|DELETE|ALTER|CREATE|DROP|TRUNCATE)\b/i`
  **only when** it is an argument to a call whose callee property name is one
  of: `execute`, `query`, `execQuery`, `execUpdate`, `execDelete`,
  `selectAll`, `selectOne`, `selectValue`, `selectValues`, `exec`.
  (Anchored keyword + execution-sink restriction keeps false positives near
  zero; do NOT flag bare SQL-looking strings in other positions — error
  messages and comments would drown the report.)
- Also flag `.replace(` / `.concat(` calls whose receiver is a variable named
  `sql` (the RFC-0022 string-surgery pattern) as a separate messageId
  `noSqlSurgery` — report-only via the same rule.
- Baseline: generated `eslint/no-raw-sql-exclude.json` (array of file paths,
  consumed the same way `require-canonical-schema-exclude.json` is) for
  current violators, committed with the PR. Severity `error`, like the
  sibling rules — the baseline keeps the repo green.

## Acceptance criteria

- [ ] `no-raw-sql.test.mjs` covers: flagged `connection.execute("SELECT …")`,
      allowed identical call inside `connection-adapters/`, allowed
      non-sink SQL-looking string (e.g. in an error message), template
      literal with interpolation flagged, `sql.replace(` surgery flagged.
- [ ] Registered in `eslint.config.mjs` with the scoping above; `pnpm lint`
      passes with the committed baseline; baseline entry count stated in the
      PR description.
- [ ] Run the rule once without the baseline and paste the violation list
      into the PR description (it doubles as the burndown worklist; expect
      hits in `relation.ts` / `relation/calculations.ts` per RFC 0022).
- [ ] Lint-only PR — no runtime source changes. ≤500 LOC excluding generated
      JSON.
