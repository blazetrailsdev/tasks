---
title: "Worker-DB fallback: file-backed default + fix stale :memory: comment"
status: draft
updated: 2026-06-15
rfc: "0029-sqlite-memory-fidelity"
cluster: worker-db
deps: []
deps-rfc: []
est-loc: 40
priority: 20
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Rails' default SQLite test connection is **file-backed**
(`config.example.yml` `sqlite3.arunit` → `FIXTURES_ROOT/fixture_database.sqlite3`);
`:memory:` is the opt-in `sqlite3_mem` profile only. In trails the default
worker DB is already file-backed in the live CI path — globalSetup
(`template-global-setup.ts`) builds an on-disk template and
`test-setup-worker-db.ts:155` stamps a per-worker `.sqlite` file into
`AR_TEST_WORKER_DB`. But two residual gaps remain (RFC Design §"default worker
DB is already file-backed"):

1. `test-helpers/test-database-config.ts:39` and `:102` fall back to
   `getEnv("AR_TEST_WORKER_DB") ?? ":memory:"`. When globalSetup did not
   provision (setup-free path / future refactor), the suite silently drops to
   in-memory instead of a file — a latent fidelity loss.
2. `vitest.config.ts:206` carries a stale comment: _"SQLite uses :memory: which
   is isolated per fork by default."_ Workers use on-disk clones now; the
   comment is wrong and propagates the wrong mental model.

## Acceptance criteria

- [ ] The fallback in `test-database-config.ts` (`resolve()` and
      `establishFromTestConfig()`) resolves to a **file-backed** SQLite DB
      (e.g. a per-process temp path via the os/fs-adapter) when
      `AR_TEST_WORKER_DB` is unset, instead of `:memory:`. Use the
      activesupport fs/os adapters — no `node:*` APIs (matches
      `sqlite-template.ts` hard rule).
- [ ] The primary CI path is unchanged: when globalSetup has stamped
      `AR_TEST_WORKER_DB`, that value still wins; this only changes the
      unset-fallback branch.
- [ ] `vitest.config.ts:206` comment corrected to describe the on-disk
      per-worker clone model (point at `sqlite-template.ts` / globalSetup).
- [ ] Per-worker **isolation is unchanged** — each worker keeps its own file;
      no shared file path is introduced (see Notes — flake interaction).
- [ ] No test renames. Targeted runs of the touched setup/helper tests pass on
      SQLite locally; CI green on all three adapters.

## Notes

**Flake interaction (sequence, do not race):** this story touches the same
worker-DB plumbing as the shared-table flake work (items/posts/people/accounts
shared-DB flakes in memory + RFC 0019). It must NOT change the per-worker
isolation model — only the unset-fallback database name. Coordinate so this
lands without overlapping a flake-fix PR on the same files.

Rails ref: `vendor/rails/activerecord/test/config.example.yml` (`sqlite3`
vs `sqlite3_mem`); `vendor/rails/activerecord/test/config.rb` (`FIXTURES_ROOT`).
</content>
