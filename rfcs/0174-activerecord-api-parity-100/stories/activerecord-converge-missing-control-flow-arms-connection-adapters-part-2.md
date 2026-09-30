---
title: "activerecord: restore the 22 dropped Rails branches in connection-adapters part 2 (report-arms missing rows)"
status: ready
updated: 2026-09-30
rfc: "0174-activerecord-api-parity-100"
cluster: arms
packages: ["activerecord"]
deps: []
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

`pnpm parity:api:arms:report --package=activerecord --direction=missing` (RFC 0113; `if`/`loop`/`try`/
`rescue` are report-only, only `throw` is gated). A missing arm is a Rails branch the port does not take —
9 in 10 are real (RFC 0113's stratified read). The connection-adapters pairs:

- `connection-adapters/mysql2/database-statements.ts#performQuery` — `-try +if +if +if +if +if +if`
- `connection-adapters/postgresql-adapter.ts#disconnectBang` — `-rescue +if`
- `connection-adapters/postgresql-adapter.ts#discardBang` — `-try -rescue +if`
- `connection-adapters/postgresql-adapter.ts#extensions` — `-if`
- `connection-adapters/postgresql-adapter.ts#enumTypes` — `-loop -if`
- `connection-adapters/postgresql-adapter.ts#isCachedPlanFailure` — `-try -rescue +if +if`
- `connection-adapters/postgresql-adapter.ts#reconnect` — `-try -rescue -if`
- `connection-adapters/postgresql-adapter.ts#updateTypemapForDefaultTimezone` — `-if`
- `connection-adapters/postgresql-adapter.ts#dbconsole` — `-if`
- `connection-adapters/postgresql-adapter.ts#dealloc` — `-try -if -rescue`
- `connection-adapters/postgresql/database-statements.ts#cancelAnyRunningQuery` — `-try -if -rescue`
- `connection-adapters/postgresql/schema-statements.ts#indexes` — `-loop +if`
- `connection-adapters/postgresql/schema-statements.ts#setPkSequenceBang` — `-if`
- `connection-adapters/postgresql/schema-statements.ts#buildChangeColumnDefaultDefinition` — `-if`
- `connection-adapters/postgresql/schema-statements.ts#quotedIncludeColumnsForIndex` — `-loop +if +if`
- `connection-adapters/postgresql/schema-statements.ts#quotedScope` — `-if`
- `connection-adapters/schema-cache.ts#_loadFrom` — `-if -if +try +rescue`
- `connection-adapters/sqlite3-adapter.ts#isActive` — `-if`
- `connection-adapters/sqlite3-adapter.ts#disconnectBang` — `-try -rescue`
- `connection-adapters/sqlite3-adapter.ts#alterTable` — `-loop`
- `connection-adapters/sqlite3-adapter.ts#copyTable` — `-if -if`
- `connection-adapters/sqlite3-adapter.ts#dbconsole` — `-if`

## Acceptance criteria

- [ ] Each pair's branches match its Rails body (CLAUDE.md § "Control flow"): same guards, order, early returns.
- [ ] The missing-direction report shows 0 activerecord rows in these files.
- [ ] Tests exercising the restored branches are ported or already green.
