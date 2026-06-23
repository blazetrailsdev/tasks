---
title: "Dedup identical URI-aware resolveDatabasePath across node-sqlite and libsql drivers"
status: done
updated: 2026-06-23
rfc: "0026-adapter-layout-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: 5
pr: 4040
claim: "2026-06-23T23:23:01Z"
assignee: "sqlite-uri-resolver-dedup-node-libsql"
blocked-by: null
---

## Context

After PR #3947 converged the SQLite driver `resolveDatabasePath` resolvers,
two of the three are now **character-for-character identical**:

- `packages/activerecord/src/sqlite/node-sqlite.ts:147-176`
- `packages/activerecord/src/sqlite/libsql.ts:129-157`

Both are URI-aware (the underlying driver enables `SQLITE_OPEN_URI`), so they
share the same logic: preserve rootless `file:foo.db` as cwd-relative, decode
percent-escapes, `?mode=memory`→null, strip `?`/`#` from rootless bodies.

The third resolver (`better-sqlite3.ts`) genuinely diverges — that build does
NOT set `SQLITE_OPEN_URI`, so it opens strings literally and its resolver is a
trivial `:memory:`→null / literal-identity. It must stay separate.

The PR #3947 reviewer flagged the node-sqlite ↔ libsql duplication as
non-blocking ("leaving it duplicated is defensible" given the repo's
file-matches-layout convention), so it was intentionally left duplicated.

## Acceptance criteria

- [ ] Extract the shared URI-aware `resolveDatabasePath` into one helper
      consumed by both `node-sqlite.ts` and `libsql.ts`, without changing
      behavior (all existing driver tests stay green).
- [ ] Leave `better-sqlite3.ts`'s literal resolver as-is (it diverges by design).
- [ ] Keep the helper located so the per-driver layout convention isn't harmed
      (e.g. a small shared sqlite-uri module under `src/sqlite/`).
