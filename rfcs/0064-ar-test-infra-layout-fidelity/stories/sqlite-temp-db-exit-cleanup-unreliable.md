---
title: "sqlite temp DB exit cleanup does not fire under vitest forks"
status: in-progress
updated: 2026-07-29
rfc: "0064-ar-test-infra-layout-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: 5580
claim: "2026-07-29T17:46:29Z"
assignee: "sqlite-temp-db-exit-cleanup-unreliable"
blocked-by: null
closed-reason: null
---

## Context

`registerDbFileCleanupOnExit` (`packages/activerecord/src/support/sqlite-template.ts:77-90`)
attaches a `process.on("exit")` handler that unlinks a sqlite file DB and its
`-wal` / `-shm` sidecars. It does not reliably fire under vitest's fork pool:
after local runs, `/tmp` accumulates `ar-test-worker-*.sqlite` and
`ar-test-template-*.sqlite` files from earlier runs (observed 2026-07-27, files
dated days apart), plus the `*_arunit2` sibling #5397 registers the same way.

Every one of those paths goes through the same registration, so the leak is in
the mechanism (an exit handler that a killed or `process.exit`-ed worker never
runs), not in any single caller.

Not merge-blocking for #5397 — the files are inert and the behavior predates it.

## Acceptance criteria

- Determine why the `exit` handler does not run for vitest worker processes.
- Replace or supplement it with a sweep that survives an abrupt worker exit —
  e.g. the globalSetup teardown unlinking by path prefix, which already owns the
  template DB lifecycle (`support/template-global-setup.ts:113`).
- A local run leaves no `ar-test-worker-*` / `ar-test-template-*` / `*_arunit2`
  files in the temp dir.
