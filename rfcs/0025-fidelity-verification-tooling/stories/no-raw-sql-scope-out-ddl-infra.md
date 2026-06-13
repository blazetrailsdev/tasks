---
title: "no-raw-sql: scope out test-helpers/test-setup DDL infra instead of baseline-grandfathering"
status: ready
updated: 2026-06-13
rfc: "0025-fidelity-verification-tooling"
cluster: null
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

The `blazetrails/no-raw-sql` rule (#3163) grandfathered 10 files. Six of those
are test infrastructure that legitimately renders DDL/SQL and will never
migrate to `@blazetrails/arel`:

- `test-helpers/define-fixtures.ts`
- `test-helpers/drop-all-tables.ts`
- `test-helpers/template-global-setup.ts`
- `test-setup-worker-db.ts`

Carrying these in `eslint/no-raw-sql-exclude.json` muddies the baseline as a
burndown worklist — it conflates "not yet migrated" with "never migrating."
The rule already excludes `connection-adapters/**`, `adapters/**`, `tasks/**`,
and `schema-*.ts` for the same reason (those render SQL by design).

Decide and implement: either add a `test-helpers/**` + `test-setup-*.ts` scope
exclusion to the rule (and the mirrored `isExcludedPath` check in
`eslint/no-raw-sql.mjs`), or keep them in the baseline with an explanatory
comment. Excluding is preferred so the baseline reflects only real arel
migration targets (tracked in 0022 `burn-down-no-raw-sql-baseline`).

## Acceptance criteria

- [ ] Test-infra DDL files are no longer flaggable by `no-raw-sql` (scoped out
      in both `eslint.config.mjs` ignores and the rule's `isExcludedPath`), OR
      a deliberate decision to keep them baselined is documented inline.
- [ ] `eslint/no-raw-sql-exclude.json` no longer lists the scoped-out files;
      `pnpm lint` stays green.
- [ ] `no-raw-sql.test.mjs` covers the new exclusion path.
