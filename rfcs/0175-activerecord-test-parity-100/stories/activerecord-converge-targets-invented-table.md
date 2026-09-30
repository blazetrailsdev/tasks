---
title: "activerecord: tests on the invented targets table move onto canonical tables"
status: ready
updated: 2026-09-30
rfc: "0175-activerecord-test-parity-100"
cluster: schema-fixtures
packages: ["activerecord"]
deps: ["activerecord-delete-dead-invented-schema-tables"]
deps-rfc: []
est-loc: 450
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Invented tables still referenced by tests (`scripts/schema-compare/invented-baseline.json`). CLAUDE.md
"Canonical tables only": table, column and model names must match Rails; if a test needs something the
canonical schema lacks, add it to the canonical schema — never invent. Tables: `targets`.
Rails models `Firm` / `Client` are STI subclasses of `Company` on `companies`
(`vendor/rails/v8.0.2/activerecord/test/models/company.rb`). Referencing test files:

- `packages/activerecord/src/associations/association-scope.trails.test.ts`
- `packages/activerecord/src/associations/nested-through-advanced.trails.test.ts`
- `packages/activerecord/src/associations/nested-through-preloader.trails.test.ts`
- `packages/activerecord/src/connection-handling.test.ts`
- `packages/activerecord/src/encrypti`
- `packages/activerecord/src/encryption/extended-deterministic-queries.test.ts`

## Acceptance criteria

- [ ] Each test is ported onto the canonical table and model Rails' own test uses (or, for a trails-only test, the nearest canonical model), and the invented table is deleted from both schema files and the baseline.
- [ ] `pnpm parity:schema` baselined count drops by the tables removed; touched tests green on all adapters.
