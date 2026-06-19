---
title: "insert-all-test-canonical-conversion"
status: done
updated: 2026-06-19
rfc: "0019-canonical-schema-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: 50
pr: 3442
claim: "2026-06-19T00:23:09Z"
assignee: "insert-all-test-canonical-conversion"
blocked-by: null
---

## Context

> **OBSOLETE (2026-06-16) — close on triage, do not pick up.** `main` has since
> fully converted `insert-all.test.ts` to canonical schema and removed it from
> `eslint/require-canonical-schema-exclude.json` (the canonical-schema lint now
> passes on it). This story was filed before that landed; there is nothing left
> to convert. Superseded by main's conversion.

`packages/activerecord/src/insert-all.test.ts` (1611 LOC) is on
`eslint/require-canonical-schema-exclude.json` (grandfathered, canonical-schema
lint OFF). It uses bespoke `defineSchema` across 5 describe blocks
(`books {title,author,status}`, `posts`, `items` PK=`code`, `cpk_orders`
composite PK, `ships`, `categories` STI, `developers` aliased timestamps,
`products`, `json_books`) plus ~20 inline `class X extends Base` bespoke models.

Per RFC 0019, convert to canonical `TEST_SCHEMA` + official models
(`packages/activerecord/src/test-helpers/models/`) +
`useHandlerFixtures`/`setupHandlerSuite` on the DEFAULT canonical tables, then
remove the exclude-list entry (flips the lint ON = "done" for the file).

NOTE: the partitioned-indexes test (PR #3454, RFC 0030) intentionally builds the
canonical `measurements` partitioned table via raw PG DDL — that table is from
`postgresql_specific_schema.rb`, not `schema.rb`/`TEST_SCHEMA`, and a partitioned
table cannot be expressed in `TEST_SCHEMA`; leave that test's raw DDL as-is.

## Acceptance criteria

- [ ] Convert in <=500-LOC slices: ship one slice, register the rest via
      `pnpm tasks new 0019-canonical-schema-burndown <slug>`.
- [ ] `defineSchema` passes ONLY canonical `TEST_SCHEMA` — never a bespoke/inline
      table or free table name. If the canonical schema lacks something, ADD it to
      the canonical schema (a 0019 gap); do not reintroduce bespoke defineSchema.
- [ ] Remove `packages/activerecord/src/insert-all.test.ts` from
      `eslint/require-canonical-schema-exclude.json` in the FINAL slice only.
- [ ] All test names unchanged (test:compare matching).
