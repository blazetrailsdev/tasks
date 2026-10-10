---
title: "activerecord: sql.active_record payload keys are read under the spelling they are written (lock_wait is NaN in RuntimeRegistry)"
status: ready
updated: 2026-10-10
rfc: "0174-activerecord-api-parity-100"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Found while auditing `packages/activerecord/src/log-subscriber.ts` for trails#8393.

Rails writes and reads the `sql.active_record` payload under one key each:

- `vendor/rails/v8.0.2/activerecord/lib/active_record/future_result.rb:45` writes `event.payload[:lock_wait] = @future_result.lock_wait`.
- `vendor/rails/v8.0.2/activerecord/lib/active_record/runtime_registry.rb:78-80` reads it: `async_sql_runtime += (runtime - payload[:lock_wait])`.
- `vendor/rails/v8.0.2/activerecord/lib/active_record/log_subscriber.rb:23,33` reads `payload[:lock_wait]` and `payload[:type_casted_binds]`.

trails writes the snake_case spelling and reads two:

- `packages/activerecord/src/future-result.ts` (`EventBuffer#flush`) writes `event.payload.lock_wait`, and `packages/activerecord/src/connection-adapters/abstract-adapter.ts` (`log`) writes `type_casted_binds` and `row_count`.
- `packages/activerecord/src/runtime-registry.ts` reads `payload.lockWait`, a key no production writer sets. For an async query the subtraction is `runtime - undefined`, so `asyncSqlRuntime` becomes `NaN`. Only `runtime-registry.trails.test.ts` passes `lockWait`, which is why it is green.
- `packages/activerecord/src/log-subscriber.ts` (`sql`) hedges with `payload.lock_wait ?? payload.lockWait ?? 0` and `payload.type_casted_binds ?? payload.typeCastedBinds`, two arms and a `0` default Rails does not have.

## Converged shape

One spelling per key, the one the writers already emit, read with no fallback: `runtime-registry.ts` reads `payload.lock_wait`, and `log-subscriber.ts` reads `payload.lock_wait` and `payload.type_casted_binds` alone. If the repo-wide rule for a Symbol-keyed hash (CLAUDE.md, "`symbolize_keys` on an option hash": camelCase) is taken to cover notification payloads, the writers move instead; decide that first and apply it to every `sql.active_record` key (`type_casted_binds`, `row_count`, `lock_wait`, `statement_name`) in one PR.

## Acceptance criteria

- [ ] `runtime-registry.ts` reads the key `future-result.ts` writes; a test drives an async query through `FutureResult` (not a hand-built payload) and asserts `asyncSqlRuntime` is a finite number.
- [ ] `log-subscriber.ts` `sql` reads each payload key under one spelling, with no `??` fallback and no `0` default.
- [ ] `runtime-registry.trails.test.ts` and `log-subscriber.test.ts` build payloads with the production spelling.
- [ ] `pnpm parity:api:calls` and `pnpm parity:api:calls:args` stay green.
