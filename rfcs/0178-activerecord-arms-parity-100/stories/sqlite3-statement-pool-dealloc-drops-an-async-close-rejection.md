---
title: "activerecord: SQLite3 StatementPool#dealloc drops an async driver's close rejection"
status: draft
updated: 2026-10-09
rfc: "0178-activerecord-arms-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `SQLite3Adapter::StatementPool#dealloc` is `stmt.close unless stmt.closed?`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/sqlite3_adapter.rb:97-99`),
synchronous, raising at the call site.

`packages/activerecord/src/connection-adapters/sqlite3-adapter.ts` (`StatementPool#dealloc`) is
`if (!stmt.closed) void Promise.resolve(stmt.close()).catch(() => {})`. The Node SQLite drivers
close synchronously and still raise at the call site. The expo driver's `ExpoStatement#close`
(`packages/activerecord/src/sqlite/expo-sqlite.ts:235-242`) awaits `finalizeAsync` and can reject,
and `ConnectionAdapters::StatementPool#[]=`, `#clear` and `#delete`
(`packages/activerecord/src/connection-adapters/statement-pool.ts`) call `dealloc` in line as
`statement_pool.rb:28-52` does, so nothing awaits that promise. The `catch` keeps a failed finalize
from becoming an unhandled rejection, at the cost of dropping the error. It carries
`@inventedArm catch — CONVERGEABLE` pointing here. trails#8716 introduced it.

The same shape is already ratified for one other body: `lookupCastTypeFromColumn` drops the
rejection of the `verifyBang` it starts (`packages/activerecord/CLAUDE.md` § "Adapter facts are
prewarmed and peeked").

## Acceptance criteria

- [ ] Either the expo statement's finalize failure reaches a caller that awaits it (and the
      `catch` and its receipt are deleted), or the repo owner ratifies the dropped rejection in
      `packages/activerecord/CLAUDE.md` and the receipt becomes `PERMANENT`.
- [ ] `pnpm parity:api:arms:throws` stays green.
