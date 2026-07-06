---
title: "Declare real columns on PG adapter-suite bespoke test models"
status: ready
updated: 2026-07-06
rfc: "0046-strict-write-attribute-internal-convergence"
cluster: null
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

PR #4027 shipped strict `AttributeSet#writeFromUser`. The post-INSERT primary-key
write-back (`base.ts` `_createOrUpdate` → `_writeAttribute`) currently survives an
incomplete attribute set via the internal-write bridge in
`packages/activerecord/src/readonly-attributes.ts` `_writeAttribute`
(`catch (MissingAttributeError) → writeCastValue`). PG adapter test suites build
bespoke models on raw-created tables (`adapter.exec("CREATE TABLE …")`) without
seeding columns, so they depend on that bridge.

Affected (non-exhaustive; confirm via the PostgreSQL CI job):
`packages/activerecord/src/adapters/postgresql/*.test.ts`
(`array`, `bytea`, `citext`, `composite`, `datatype`, `domain`, `explain`,
`foreign-table`, `hstore`, `infinity`, `interval`, `json`, `money`, `network`,
`numbers`, `range`, `schema`, `timestamp`, `uuid`, `virtual-column`, `xml`,
`enum`) and `connection-adapters/postgresql-adapter.test.ts`.

## Acceptance criteria

- [ ] Every bespoke `class X extends Base` in the PG adapter suites that
      constructs + saves declares its **real** primary key — `id` integer for
      a standard table, the actual `uuid` / composite / custom PK otherwise
      (mirror the raw DDL; do NOT invent an `id` for a uuid/composite table).
- [ ] Declare framework-written columns these models touch (timestamps, lock
      column) where the table has them.
- [ ] PostgreSQL CI job passes with NO reliance on the internal-write bridge for
      these files (verify by spot-removing the bridge locally against PG, or hand
      off the cross-check to the bridge-removal story).
