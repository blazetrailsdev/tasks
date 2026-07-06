---
title: "Declare real columns on MySQL/MariaDB adapter-suite bespoke test models"
status: ready
updated: 2026-07-06
rfc: "0046-strict-write-attribute-internal-convergence"
cluster: null
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Same as the PG sibling story, for the MySQL/MariaDB adapter suites. The
internal-write bridge in `readonly-attributes.ts` `_writeAttribute` keeps these
green today; this story declares real columns so the bridge can be removed.

Affected (confirm via the MariaDB / MySQL CI jobs):
`packages/activerecord/src/adapters/mysql2/*.test.ts`,
`packages/activerecord/src/adapters/abstract-mysql-adapter/*.test.ts`
(`case-sensitivity`, `mysql-boolean`, `mysql-enum`, `unsigned-type`),
`connection-adapters/mysql2-adapter.test.ts`.

## Acceptance criteria

- [ ] Every bespoke model in the MySQL/MariaDB adapter suites that constructs +
      saves declares its real primary key + any framework-written columns
      (timestamps, lock column), mirroring the raw DDL.
- [ ] MariaDB and MySQL CI jobs pass with no reliance on the internal-write
      bridge for these files.
