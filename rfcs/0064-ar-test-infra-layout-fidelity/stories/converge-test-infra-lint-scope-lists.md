---
title: "Converge the remaining test-infra ESLint scope lists onto one source of truth"
status: done
updated: 2026-07-30
rfc: "0064-ar-test-infra-layout-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 110
priority: null
pr: 5672
claim: "2026-07-30T20:23:19Z"
assignee: "converge-test-infra-lint-scope-lists"
blocked-by: null
closed-reason: null
---

## Context

PR #5408 gave `blazetrails/no-raw-sql` a single source of truth for its scope
(`eslint/no-raw-sql-scope.mjs`: one root + one glob list, consumed by both
`eslint.config.mjs` and the rule's own `isExcludedPath()`/`repoRel()`). The same
duplication remains for the other test-infra-scoped rules, so every remaining
RFC 0064 file move still has to touch several lists:

- `eslint.config.mjs:430-438` (`require-table-teardown`) and
  `eslint.config.mjs:465-473` (`require-canonical-rebuild`) carry an identical
  six-glob test-infra exemption list (`test-helpers/**`, `support/**`,
  `fixtures.test.ts`, `naked-fixtures.test.ts`, `test-fixtures.test.ts`,
  `test-fixtures/**`), duplicated between the two blocks.
- `eslint/no-internal-canonical-loaders.mjs:44-52` hardcodes
  `support/canonical-schema.test.ts` / `support/load-schema-helper.test.ts`
  paths inside the rule.

A miss is silent until CI lint runs, which is exactly what bit PR #5395.

## Acceptance criteria

- The shared test-infra exemption list is declared once and consumed by both
  the `require-table-teardown` and `require-canonical-rebuild` config blocks.
- `no-internal-canonical-loaders`' hardcoded `support/` paths derive from the
  same shared declaration (or are otherwise anchored in one place).
- Behavior unchanged: the set of files each rule applies to is identical
  before/after (verify by classifying every `.ts` under
  `packages/activerecord/src` with the old and new lists).
- No new third-party deps. Follow the `eslint/no-raw-sql-scope.mjs` pattern.
