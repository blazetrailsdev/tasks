---
title: "ARCONN=sqlite3_mem lane fails wholesale — decide supported vs vestigial"
status: ready
updated: 2026-07-25
rfc: "0029-sqlite-memory-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ARCONN=sqlite3_mem` is a first-class named connection in
`packages/activerecord/src/test-helpers/test-database-config.ts` (the
`CONNECTIONS` table, alongside `sqlite3` / `postgresql` / `mysql2`), building
`{ adapter: "sqlite3", database: ":memory:", pool: 1 }`. It is the lane that
exercises Rails' `in_memory_db?` conditions — the very thing RFC 0029 is about.

Measured while verifying #5284:

````console
ARCONN=sqlite3_mem pnpm vitest run packages/activerecord/src/adapter.test.ts
  Tests  47 failed | 26 skipped (73)
```text

Every non-skipped test in the file fails, including ones untouched by that PR
(`tables`, `indexes`, `valid column`, ...) — the canonical schema is not laid in
the `:memory:` database the test connection ends up on. Pre-existing, not a
regression. CI only runs `sqlite3` / `postgresql` / `mysql2`, so the lane is
unguarded and silently rots.

Scope check needed as part of this story: whether the breakage is specific to
`adapter.test.ts` or file-wide across the AR suite, and whether `sqlite3_mem` is
intended to be a runnable lane at all or is vestigial. Related:
`audit-residual-memory-sites` (blocked) and `worker-db-fallback-file-backed`
(done).

## Acceptance criteria

- [ ] Determine whether `ARCONN=sqlite3_mem` is a supported lane or should be
      removed from `CONNECTIONS`.
- [ ] If supported: the canonical schema reaches the `:memory:` connection the
      tests lease, and `adapter.test.ts` passes (modulo Rails' own
      `in_memory_db?` skips) under that ARCONN.
- [ ] If vestigial: the entry is deleted and any `inMemoryDb()` consumers that
      only made sense for it are re-derived.
- [ ] Either way, the lane's status is recorded so it does not silently rot —
      if supported, it is exercised somewhere CI can see.
````
