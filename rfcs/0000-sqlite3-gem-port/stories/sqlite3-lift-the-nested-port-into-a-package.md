---
title: "Move packages/activerecord/src/sqlite/ to packages/sqlite3 as @blazetrails/sqlite3"
status: draft
updated: 2026-10-08
rfc: "0000-sqlite3-gem-port"
cluster: package
packages: ["sqlite3", "activerecord", "scripts"]
deps: []
deps-rfc: []
est-loc: 500
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The vendored `sqlite3` gem is already a `parity:api` package, nested inside activerecord:
`scripts/api-compare/config.ts:46` (`PACKAGE_DIR_OVERRIDES.sqlite3 = "activerecord"`) and `:110`
(`PACKAGE_SRC_SUBDIR.sqlite3 = "sqlite"`) map it onto `packages/activerecord/src/sqlite/` (15 files, 4,386 lines;
229/303 methods, files 3/7, 115 pins). RFC 0184 records that nested shape as "not preferred and
is being undone".

This story is a move with no behaviour change. Files: `database.ts`, `errors.ts`, `pragmas.ts`,
`sqlite-uri.ts`, `better-sqlite3.ts`, `libsql.ts`, `node-sqlite.ts`, `expo-sqlite.ts` and their
tests. Importers: the six `packages/activerecord/src/connection-adapters/*-adapter.ts` driver subclasses, `packages/activerecord/src/connection-adapters/sqlite3-adapter.ts:19-20`,
`packages/activerecord/src/connection-adapters/sqlite3/quoting.ts:20`, `packages/activerecord/src/test-setup-worker-db.ts:4`, `packages/activerecord/src/cases/helper.ts:1`,
`packages/activerecord/src/support/sqlite-template.ts:2`, `packages/activerecord/src/support/template-global-setup.ts:4`.

Two edges point the wrong way and must be cut for the package to be a leaf:
`sqlite/better-sqlite3.ts:4` and `sqlite/libsql.ts:4` import `ConfigurationError` from
`../errors.js`, and every driver imports its types and `SQLite3Constants` from
`../sqlite-adapter.js` (`sqlite/better-sqlite3.ts:6-19`).

## Acceptance criteria

- [ ] `packages/sqlite3` exists (`@blazetrails/sqlite3`; `package.json` with `exports` for `"."`, `"./better-sqlite3"`, `"./libsql"`, `"./node-sqlite"`, `"./expo-sqlite"`; `better-sqlite3`, `libsql`, `expo-sqlite` optional peers; `@blazetrails/ruby-compat` the only workspace dependency) and holds every file from `packages/activerecord/src/sqlite/`. `packages/activerecord/src/sqlite/` is gone.
- [ ] The driver interfaces and `SQLite3Constants` move from `packages/activerecord/src/sqlite-adapter.ts` into the package unchanged (they are replaced by later stories); `sqlite-adapter.ts` re-exports nothing from the package that it did not export before.
- [ ] The `ConfigurationError` raises are replaced by what the gem raises at that point, or moved to the activerecord caller that owns the Rails error; the package imports nothing from activerecord. Each of the two sites is listed in the PR body with its decision.
- [ ] `scripts/api-compare/config.ts` loses both override rows; `receipt-audit.ts:200`'s nested-package handling still has a test. Every `call-mismatches-exclude/`, body-pin and mark shard keyed under the old path is moved, not reseeded: `pnpm parity:api` reports the same 229/303 and 115/115 pins before and after.
- [ ] `vendor/sources.ts`'s `sqlite3` comment no longer says the ports live in activerecord.
- [ ] Registrations per RFC 0000-sqlite3-gem-port § "Registration cost" items 1 to 3 and 6 to 8, including a CI lane that runs the five driver `*.trails.test.ts` suites and the `ci-suite-coverage` fixture literals.
- [ ] `pnpm test:types`, `pnpm test:types:virtualized` and the website build are green; verified with a plain-node import of built `dist/` for each subpath.

## Verification

```bash
pnpm parity:api && pnpm test:types && pnpm test:types:virtualized
```

## Notes

`git mv` so history follows. `git diff --name-only` hides a rename's delete half (memory); use
`--name-status` when checking the diff. Moving a ported method stales body pins: run
`pnpm parity:api:pins`.
