---
title: "wave-3c-postgresql-adapter"
status: done
updated: 2026-08-16
rfc: "0106-wide-call-set-direct-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6581
claim: "2026-08-15T22:45:03Z"
assignee: "wave-3c-postgresql-adapter"
blocked-by: null
closed-reason: null
---

# Wave 3c: postgresql-adapter.ts — 29 call-set rows

## Context

Split out of `wave-3-adapters` (RFC 0106) — see that story's Notes ("125 rows
across five files is 3-5 PRs. Split per file and file each as its own story").
The parent PR shipped `connection-adapters/abstract-adapter.ts` and
`connection-adapters/abstract/schema-statements.ts`.

`scripts/api-compare/call-mismatches-exclude/activerecord/connection-adapters/postgresql-adapter.json`
carries 29 `kind: "set"` rows. Enumerate them with:

```bash
API_COMPARE_FORCE=1 pnpm parity:api --calls
# then scripts/api-compare/output/call-mismatches.json, tsFile
#   connection-adapters/postgresql-adapter.ts
```

Rails source:
`vendor/rails/activerecord/lib/active_record/connection_adapters/postgresql_adapter.rb`.

## Coordinate, do not collide

RFC 0076 (execute-primitive-convergence) and RFC 0077 (quoting-binds-fidelity)
hold open stories over this file. RFC 0013 (pg-rawconn-refinement) touches the
raw-connection seam. Read the owning story before converging a row it is about;
if the row IS the fix, converge it and close that story with a pointer.

## Acceptance criteria

- [ ] Every `postgresql-adapter.ts` row is converged, or carries a reviewed
      one-line `reason` / `@missingRailsCall` at the call site.
- [ ] No `current_adapter?` arm dropped.
- [ ] Rows deleted by hand from the shard; stale marks fixed with
      `pnpm parity:api:calls:tighten activerecord/connection-adapters/postgresql-adapter.json`.
- [ ] `pnpm parity:api:calls` green; in-scope count falls.
- [ ] SQLite, PostgreSQL and MySQL/MariaDB lanes green.
