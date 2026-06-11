---
title: "calculations.test.ts → canonical schema + Rails fixtures (per-describe series)"
status: draft
updated: 2026-06-11
rfc: "0019-canonical-schema-burndown"
cluster: fixtures
deps: ["shared-table-convergence"]
deps-rfc: []
est-loc: 500
priority: 7
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Carved out of `calculations-aggregations`. `calculations.test.ts` is the largest
file in the suite (~7.3k LOC) and must be converted per-`describe` across sibling
PRs off `main` — too large for a single 300-LOC PR. It touches shared tables
(`accounts`, `companies`, `people`) so it depends on `shared-table-convergence`
(done).

Convert each describe to ride `TEST_SCHEMA` + canonical models (Account, Company,
…) + `fixtures` / `name(:label)` lookups where `calculations_test.rb` does. Match
each test body word-for-word; test names unchanged.

## Acceptance criteria

- [ ] Each converted describe rides `TEST_SCHEMA` + canonical models + fixture
      lookups; no redundant `defineSchema`.
- [ ] Test bodies match `calculations_test.rb`; test names unchanged.
- [ ] `pnpm vitest run packages/activerecord/src/calculations.test.ts` passes
      (co-run colliding siblings under `maxForks=1`).
- [ ] When the whole file is converted, remove `calculations.test.ts` from
      `eslint/require-canonical-schema-exclude.json` +
      `eslint/expected-fixtures-exclude.json`; zero `require-canonical-schema` errors.

## Notes

- Multi-PR by necessity — ship one describe (or a small group) per PR off `main`,
  non-overlapping; do NOT stack. Register further continuation stories as needed.
