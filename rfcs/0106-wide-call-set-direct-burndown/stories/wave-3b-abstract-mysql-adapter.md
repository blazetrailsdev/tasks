---
title: "wave-3b-abstract-mysql-adapter"
status: done
updated: 2026-08-15
rfc: "0106-wide-call-set-direct-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6577
claim: "2026-08-15T20:15:04Z"
assignee: "wave-3b-abstract-mysql-adapter"
blocked-by: null
closed-reason: null
---

# Wave 3b: abstract-mysql-adapter.ts — 30 call-set rows

## Context

Split out of `wave-3-adapters` (RFC 0106) — see that story's Notes ("125 rows
across five files is 3-5 PRs. Split per file and file each as its own story").
The parent PR shipped `connection-adapters/abstract-adapter.ts` and
`connection-adapters/abstract/schema-statements.ts`.

`scripts/api-compare/call-mismatches-exclude/activerecord/connection-adapters/abstract-mysql-adapter.json`
carries 30 `kind: "set"` rows. Enumerate them with:

```bash
API_COMPARE_FORCE=1 pnpm parity:api --calls
# then scripts/api-compare/output/call-mismatches.json, tsFile
#   connection-adapters/abstract-mysql-adapter.ts
```

Rails source:
`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract_mysql_adapter.rb`.

## Coordinate, do not collide

RFC 0076 (execute-primitive-convergence) and RFC 0077 (quoting-binds-fidelity)
hold open stories over this file's `internal_execute` / `raw_execute` /
`quote_table_name` rows. Read the owning story before converging a row it is
about; if the row IS the fix, converge it and close that story with a pointer.

## Acceptance criteria

- [ ] Every `abstract-mysql-adapter.ts` row is converged, or carries a reviewed
      one-line `reason` / `@missingRailsCall` at the call site.
- [ ] No `current_adapter?` arm dropped; MariaDB-vs-MySQL branches both kept.
- [ ] Rows deleted by hand from the shard; stale marks fixed with
      `pnpm parity:api:calls:tighten activerecord/connection-adapters/abstract-mysql-adapter.json`.
- [ ] `pnpm parity:api:calls` green; in-scope count falls.
- [ ] SQLite, PostgreSQL and MySQL/MariaDB lanes green.
