---
title: "active-record-module-config-lets-are-module-ivars"
status: in-progress
updated: 2026-10-15
rfc: "0189-activerecord-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#8921
claim: "2026-10-14T23:58:37Z"
assignee: "abstract-class-as-a-static-field-is-inherited"
blocked-by: null
closed-reason: null
---

## Context

Rails keeps the `ActiveRecord` module's singleton config in ivars of the module object: `singleton_class.attr_accessor :async_query_executor` (`vendor/rails/v8.0.2/activerecord/lib/active_record.rb:283-284`), `@global_executor_concurrency` (`:299-311`), and the rest of `active_record.rb:182-491`.

In `packages/activerecord/src/active-record.ts` they are 35 module-level `let _x` bindings (`:17-50`), which nothing outside the module can reach with `instance_variable_get` / `instance_variable_set`. trails#8866 moved one, `@global_thread_pool_async_query_executor` (`active_record.rb:286-294`), onto the `ActiveRecord` namespace object, read and written with `rbObjIvarGet` / `rbObjIvarSet`, because `asynchronous_queries_test.rb:185-223` resets it that way. The others still differ in kind from it, and `_globalExecutorConcurrency` and `_asyncQueryExecutor` sit beside it in the same three methods.

## Acceptance criteria

- [ ] Each `let _x` in `active-record.ts` that stands for a Rails `@x` ivar of the `ActiveRecord` module is an ivar of the `ActiveRecord` namespace object, reachable with `rbObjIvarGet(ActiveRecord, "@x")`.
- [ ] The public readers and writers keep their Rails names and bodies; no setter Rails does not have is added.
- [ ] `pnpm parity:api:calls`, `pnpm parity:api:calls:args` and `pnpm parity:api:extra:gate` stay green.
