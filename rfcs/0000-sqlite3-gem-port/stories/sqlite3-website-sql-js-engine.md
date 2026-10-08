---
title: "website: the sql.js driver becomes an engine under SQLite3::Database"
status: draft
updated: 2026-10-08
rfc: "0000-sqlite3-gem-port"
cluster: drivers
packages: ["website", "sqlite3"]
deps: ["sqlite3-database-class-carries-the-gem-surface"]
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/website/src/lib/frontiers/sql-js-driver.ts` (`:178-185`) is a `SqliteDriver` named
`"sql.js"` over the sandbox's one sql.js handle; `sql-js-adapter.ts` builds the adapter. It is
the sixth implementation of the seam and the in-browser SQLite path.

It stays in `packages/website`: `sql.js` is the website's dependency, not a peer of the package.

## Acceptance criteria

- [ ] `sql-js-driver.ts` implements the engine interface type exported from `@blazetrails/sqlite3` and no longer imports seam types from `@blazetrails/activerecord`.
- [ ] The website's vitest alias resolves `@blazetrails/sqlite3` and its subpaths (the alias is a prefix match; add the specific entries before the general one).
- [ ] `sql-js-driver.test.ts` and `sandbox-sw.test.ts` pass; the service-worker bundle builds (no top-level await in the IIFE).

## Verification

```bash
pnpm vitest run packages/website/src/lib/frontiers
```
