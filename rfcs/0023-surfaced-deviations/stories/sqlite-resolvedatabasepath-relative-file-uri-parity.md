---
title: "Converge resolveDatabasePath relative file: URI handling across SQLite drivers"
status: done
updated: 2026-06-23
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 90
priority: 40
pr: 3947
claim: "2026-06-23T01:23:16Z"
assignee: "sqlite-resolvedatabasepath-relative-file-uri-parity"
blocked-by: null
---

## Context

The libsql driver work (PR #3664) revealed that the shared `resolveDatabasePath`
URI logic — copied verbatim into `better-sqlite3.ts:102-124`, `node-sqlite.ts:130-145`,
and now `libsql.ts` — anchors rootless `file:` URIs at `/` via `new URL(db, "file:///")`,
so `resolveDatabasePath("file:relative.db")` returns `/relative.db`.

For libsql this was a real `databaseExists()` bug (libsql is URI-aware and opens
`file:relative.db` at `./relative.db`); it was fixed in `libsql.ts` by preserving
relative `file:` paths.

The sibling resolvers still anchor at `/`. For better-sqlite3 / node-sqlite this is
currently inert at the open path (their builds don't set `SQLITE_OPEN_URI`, so they
treat the string literally), BUT it means `databaseExists("file:relative.db")` checks
`/relative.db` while `open(...)` opens a literal file named `file:relative.db` — a
latent mismatch between the two code paths in the same driver.

## Acceptance criteria

- [ ] Decide the correct per-driver contract: for non-URI-aware drivers
      (better-sqlite3, node:sqlite as built here), `databaseExists` and `open`
      must agree on how `file:` strings are interpreted.
- [ ] Converge the shared resolver (or per-driver resolvers) so `databaseExists`
      matches the path each driver's `open()` actually uses, mirroring the fix
      already applied in `libsql.ts:97-135`.
- [ ] Tests covering relative `file:` URIs for each affected driver.
- [ ] Do NOT diverge drivers gratuitously — if a driver is genuinely not
      URI-aware, the resolver should reflect that driver's literal-string semantics.
