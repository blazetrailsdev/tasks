---
title: "sqlite3-engines-without-sqlite3-interrupt"
status: done
updated: 2026-11-27
rfc: "0259-near-complete-packages-to-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#10825
claim: "2026-11-27T00:14:41Z"
assignee: "response-body-does-not-buffer-readable-stream"
blocked-by: null
closed-reason: null
---

## Context

`SQLite3::Database#interrupt` is the C `interrupt` (`vendor/sqlite3/v2.7.3/ext/sqlite3/database.c:552-561`): `REQUIRE_OPEN_DB`, then an unconditional `sqlite3_interrupt(ctx->db)`. trails#10803 ported it in `packages/sqlite3/lib/database.ts`, with an optional `EngineDatabase#interrupt`. Only the libsql engine supplies one (`libsql` `Database#interrupt`). better-sqlite3, node:sqlite, bun:sqlite and expo-sqlite expose no `sqlite3_interrupt`, so `interrupt` raises `NotImplementedError` there. That arm is receipted `@inventedArm if — CONVERGEABLE sqlite3-engines-without-sqlite3-interrupt`.

## Acceptance criteria

- [ ] Each engine that can reach `sqlite3_interrupt` (upstream binding, or a release that adds it) implements `EngineDatabase#interrupt`.
- [ ] Once every engine has it, `interrupt` is required on `EngineDatabase` and the `NotImplementedError` arm and its receipt are deleted. Until then, an engine for which none exists is ruled on by the operator.
