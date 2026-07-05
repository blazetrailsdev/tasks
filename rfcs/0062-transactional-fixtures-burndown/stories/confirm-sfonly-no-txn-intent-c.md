---
title: "Confirm Bucket C setupFixtures-only no-transaction intent (audit-only)"
status: ready
updated: 2026-07-05
rfc: "0062-transactional-fixtures-burndown"
cluster: fixtures-burndown-c
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

RFC 0062 (transactional-fixtures burndown). Conversion cluster from the
caller audit (`docs/infrastructure/setupfixtures-caller-buckets-audit.md`, story `audit-setupfixtures-caller-buckets`).

**Bucket C.** setupFixtures-only, no transaction, no fixture data (PG-DDL / schema-migration / type suites that break under transactional wrapping — 25P02). AUDIT-ONLY: confirm the no-transaction intent is correct for each file; expect NO code change. If any file is found to actually want a transaction, note it — otherwise close as confirmed.

See the audit doc for the wiring identity and the no-fixture-data surface
decision (`fixtures([], { … })` — `use-fixtures.ts:439-443` treats an empty
array as a vacuous zero-fixture case that still wires suite + per-test txn).

## Files (31)

```text
packages/activerecord/src/adapters/abstract-mysql-adapter/schema-migrations.test.ts
packages/activerecord/src/adapters/postgresql/bytea.test.ts
packages/activerecord/src/adapters/postgresql/citext.test.ts
packages/activerecord/src/adapters/postgresql/composite.test.ts
packages/activerecord/src/adapters/postgresql/create-unlogged-tables.test.ts
packages/activerecord/src/adapters/postgresql/domain.test.ts
packages/activerecord/src/adapters/postgresql/enum.test.ts
packages/activerecord/src/adapters/postgresql/foreign-table.test.ts
packages/activerecord/src/adapters/postgresql/hstore.test.ts
packages/activerecord/src/adapters/postgresql/interval.test.ts
packages/activerecord/src/adapters/postgresql/ltree.test.ts
packages/activerecord/src/adapters/postgresql/money.test.ts
packages/activerecord/src/adapters/postgresql/network.test.ts
packages/activerecord/src/adapters/postgresql/numbers.test.ts
packages/activerecord/src/adapters/postgresql/range.test.ts
packages/activerecord/src/adapters/postgresql/schema-authorization.test.ts
packages/activerecord/src/adapters/postgresql/schema.test.ts
packages/activerecord/src/adapters/postgresql/timestamp.test.ts
packages/activerecord/src/adapters/postgresql/uuid.test.ts
packages/activerecord/src/adapters/postgresql/xml.test.ts
packages/activerecord/src/column-alias.test.ts
packages/activerecord/src/migration.test.ts
packages/activerecord/src/reflection.trails.test.ts
packages/activerecord/src/reserved-word.test.ts
packages/activerecord/src/sanitize.test.ts
packages/activerecord/src/statement-invalid.test.ts
packages/activerecord/src/table-metadata.test.ts
packages/activerecord/src/transaction-isolation.test.ts
packages/activerecord/src/type/integer.test.ts
packages/activerecord/src/types.test.ts
packages/activerecord/src/validations/numericality-validation.test.ts
```

## Acceptance criteria

- Convert each listed file per the Bucket C target above.
- No test renames; test names match Rails verbatim.
- Run only the touched files locally (`pnpm vitest run <file>`); do not run the full suite.
- <500 LOC; single PR from main; no stacked PRs.
