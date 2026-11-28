---
title: "sqlite3-define-function-with-flags-unbound-engines"
status: claimed
updated: 2026-11-28
rfc: "0259-near-complete-packages-to-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-11-28T02:59:50Z"
assignee: "sqlite3-define-function-with-flags-unbound-engines"
blocked-by: null
closed-reason: null
---

## Context

`SQLite3::Database#define_function_with_flags` is C (`vendor/sqlite3/v2.7.3/ext/sqlite3/database.c:507`), and the gem has no unavailable arm for it. `packages/sqlite3/lib/database.ts` `defineFunctionWithFlags` raises `NotImplementedError` when `EngineDatabase#defineFunctionWithFlags` is absent. Only `lib/engine/better-sqlite3.ts` and `lib/engine/node-sqlite.ts` supply it; libsql, expo-sqlite and bun:sqlite do not. Unlike `interrupt`, whose arm the operator ratified on 2026-11-27 in trails#10843, this guard has no receipt. The arm gate does not compare C-defined methods, so nothing flags it.

## Acceptance criteria

- [ ] Each engine lacking it either supplies `defineFunctionWithFlags` through its binding's user-function API, or the operator rules that the arm is permanent for that engine.
- [ ] If the arm is ruled permanent, the guard carries `@inventedArm if — PERMANENT` and CLAUDE.md § "Runtime facts Node does not expose" records it. Otherwise the method becomes required on `EngineDatabase` and the guard is deleted.
