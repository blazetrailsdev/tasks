---
title: "ActiveRecord types cover lock(SqlLiteral), relation class methods, maximum and logger.silence"
status: done
updated: 2026-10-29
rfc: "0196-solid-stack"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#9449
claim: "2026-10-29T19:31:14Z"
assignee: "ar-types-for-solid-stack-casts"
blocked-by: null
closed-reason: null
---

## Context

Porting SolidCable (trails#9445) needed four casts. Each covers a type gap in ActiveRecord's own declarations:

- `Base.lock` is typed `string | boolean | undefined` (`packages/activerecord/src/relation.ts:1941` for the relation side, and the static delegator). Rails' `lock(locks = true)` (`vendor/rails/v8.0.2/activerecord/lib/active_record/relation/query_methods.rb`) accepts an `Arel.sql` literal. Casts: `packages/solid-cable/src/record.ts`, `packages/solid-queue/src/record.ts`.
- `Relation<T>` carries no model class methods, so a class method reached through a scope (`Message.trimmable(...).nonBlockingLock()`) needs `as unknown as typeof Model`. Casts: `packages/solid-cable/src/trim-job.ts`, `packages/solid-queue/src/blocked-execution.ts`, `scheduled-execution.ts`.
- `Base.maximum` answers `unknown`. Cast: the solid-cable Listener's `lastId`.
- `Base.logger` is typed `BenchmarkLogger`, which has no `silence` (`activesupport/lib/active_support/logger_silence.rb`). Cast: the solid-cable Listener's `withPollingVolume`.

## Acceptance criteria

- `lock` accepts an `SqlLiteral`.
- A relation's type exposes its model's class methods, as Rails' `Relation` delegates them.
- `maximum` is typed by its column.
- `Base.logger` is typed as a logger with `silence`.
- Every listed cast is removed.
