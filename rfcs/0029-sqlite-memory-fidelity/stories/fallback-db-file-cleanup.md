---
title: "Clean up the fallback sqlite DB file on process exit"
status: in-progress
updated: 2026-07-25
rfc: "0029-sqlite-memory-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: 5293
claim: "2026-07-25T03:18:52Z"
assignee: "fallback-db-file-cleanup"
blocked-by: null
closed-reason: null
---

## Context

PR #5282 made the unset-`AR_TEST_WORKER_DB` sqlite fallback file-backed
(`packages/activerecord/src/test-helpers/test-database-config.ts`,
`fallbackDatabasePath()`). Unlike the primary clone lane in
`test-helpers/sqlite-template.ts` — which registers
`process.on("exit", () => unlinkDbFiles(fs, dest))` (sqlite-template.ts:117) —
the fallback file and its `-wal`/`-shm` sidecars are never unlinked, so each
setup-free process leaves a `ar-test-fallback-<runToken>-<slot>.sqlite` in
tmpdir. Keying on run token + slot bounds the count per run but does not clean
up across runs.

The story's hard rules barred `process.*` in the touched file, so no exit hook
was registered there; `sqlite-template.ts` already has the exception and the
`unlinkDbFiles` helper, so cleanup most likely belongs behind a small helper
exported from that module and called from the fallback path.

## Acceptance criteria

- [ ] The fallback DB file (plus `-wal`/`-shm` sidecars) is removed when the
      process exits, reusing `unlinkDbFiles` from `sqlite-template.ts`.
- [ ] Registration happens once per process (mirror the
      `ensureWorkerClone` idiom), not once per `resolve()` call.
- [ ] The stamped-`AR_TEST_WORKER_DB` path is untouched — it already has its
      own cleanup in `ensureWorkerClone`.
- [ ] No `node:*` fs APIs; fs access goes through the activesupport fs-adapter.
