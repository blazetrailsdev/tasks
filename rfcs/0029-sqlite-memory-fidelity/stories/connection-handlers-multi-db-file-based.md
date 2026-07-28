---
title: "connection-handlers-multi-db-file-based"
status: in-progress
updated: 2026-07-28
rfc: "0029-sqlite-memory-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 5491
claim: "2026-07-28T12:34:17Z"
assignee: "connection-handlers-multi-db-file-based"
blocked-by: null
closed-reason: null
---

## Context

Audit finding from `audit-residual-memory-sites` (RFC 0029).

`connection_handlers_multi_db_test.rb` uses `:memory:` in exactly **one**
place (line 78, a `connects_to database:` hash). Every other database in that
file is an explicit on-disk path:
`vendor/rails/activerecord/test/cases/connection_adapters/connection_handlers_multi_db_test.rb:95-96,121-122,153-154,270,286-287,302-303`
— `"database" => "test/db/primary.sqlite3"` / `"test/db/readonly.sqlite3"`.

trails' `packages/activerecord/src/connection-adapters/connection-handlers-multi-db.test.ts`
hardcodes `":memory:"` at lines 18, 82, 83, 116, 117, 141, 142, 177, 192, 193,
237, 251, 252, 265, 266 — 15 code sites where Rails has 1.

**Verdict: genuine over-use, not setup-helper repetition.** There is no Rails
setup helper establishing `:memory:` once; Rails deliberately names distinct
file-backed databases so `primary` and `readonly` (and `development` /
`development_readonly`) are genuinely different databases. With `:memory:` on
both sides, a test that means to prove two pools address two databases proves
nothing.

## Acceptance criteria

- [ ] Only the site corresponding to Rails' line 78 (`connectsTo({ database: {
writing, secondary } })`, trails lines 82-83) keeps `":memory:"`.
- [ ] Every other config uses a distinct on-disk sqlite path mirroring Rails'
      `test/db/primary.sqlite3` / `test/db/readonly.sqlite3` naming (trails may
      place them under a temp dir; the fidelity property is file-backed-ness +
      distinctness, per RFC 0029's per-worker-pathing decision).
- [ ] Files are created/cleaned deterministically; no cross-test leakage.
- [ ] Test names unchanged.
- [ ] `pnpm vitest run packages/activerecord/src/connection-adapters/connection-handlers-multi-db.test.ts` passes.
