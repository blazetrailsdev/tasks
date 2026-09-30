---
title: "activerecord: tests on invented clients / firms tables move onto Rails' companies STI table"
status: ready
updated: 2026-09-30
rfc: "0175-activerecord-test-parity-100"
cluster: schema-fixtures
packages: ["activerecord"]
deps: ["activerecord-delete-dead-invented-schema-tables"]
deps-rfc: []
est-loc: 600
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
canonical schema lacks, add it to the canonical schema — never invent. Tables: `clients`, `firms`.
Rails models `Firm` / `Client` are STI subclasses of `Company` on `companies`
(`vendor/rails/v8.0.2/activerecord/test/models/company.rb`). Referencing test files:

- `packages/activerecord/src/asso`
- `packages/activerecord/src/associations.test.ts`
- `packages/activerecord/src/associations/callbacks.test.ts`
- `packages/activerecord/src/associations/cascaded-eager-loading.test.ts`
- `packages/activerecord/src/associations/collection-association-bigint-number-key-match.trails.test.ts`
- `packages/activerecord/src/associations/collection-association-find-not-found.trails.test.ts`
- `packages/activerecord/src/associations/collection-proxy-replace-diff.trails.test.ts`
- `packages/activerecord/src/associations/collection-proxy.trails.test.ts`
- `packages/activerecord/src/associations/eager.test.ts`
- `packages/activerecord/src/associations/has-many-through-associations.test.ts`
- `packages/activerecord/src/associations/has-one-associations.test.ts`
- `packages/activerecord/src/associations/has-one-mid-flight-reassignment.trails.test.ts`
- `packages/activerecord/src/finder.test.ts`
- `packages/activerecord/src/relations.test.ts`
- `packages/activerecord/src/strict-loading.test.ts`
- `packages/activerecord/src/support/canonical-sc`

## Acceptance criteria

- [ ] Each test is ported onto the canonical table and model Rails' own test uses (or, for a trails-only test, the nearest canonical model), and the invented table is deleted from both schema files and the baseline.
- [ ] `pnpm parity:schema` baselined count drops by the tables removed; touched tests green on all adapters.
