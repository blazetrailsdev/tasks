---
title: "converge-configurations-storage-onto-a-single-global-registry"
status: claimed
updated: 2026-07-27
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-07-27T01:18:55Z"
assignee: "converge-configurations-storage-onto-a-single-global-registry"
blocked-by: null
closed-reason: null
---

## Context

Rails backs `ActiveRecord::Base.configurations` with a Ruby **class variable**
(`@@configurations`, `vendor/rails/activerecord/lib/active_record/core.rb:71-79`),
so the registry is process-global: `SomeModel.configurations = x` sets it for
`ActiveRecord::Base` and every other model, and there is exactly one registry.

PR #5381 converged the reader/writer pair onto the Rails-named accessor
(`Core.configurations`, `packages/activerecord/src/core.ts`), which normalizes
on write and always answers a `DatabaseConfigurations`. It deliberately kept
trails' pre-existing **per-class** storage: `configurations` writes
`this._configurations`, so an assignment on a subclass shadows `Base`'s value
through the JS static prototype chain instead of replacing the single global.

That shadowing is the remaining deviation. In-tree it is load-bearing for test
isolation — several suites (`connection-handling.test.ts`,
`connection-adapters/connection-handlers-*.test.ts`, `shard-keys.test.ts`)
assign configurations on a local model class and rely on `Base` not being
disturbed — so flipping to a true global needs those suites converted to
save/restore around a single registry first.

## Acceptance criteria

- `configurations` reads and writes one process-global registry, as Rails'
  `@@configurations` does: assigning on any model class is observable from
  `Base.configurations()` and from every other model.
- Suites that currently rely on per-class shadowing save and restore the
  global registry instead (they already do this for `Base`; extend the same
  pattern to the local-model cases).
- `Base.configurations({})` still seeds the empty registry at load
  (core.rb:74).
- `pnpm typecheck`, `pnpm lint`, and the connection-handling / shard-keys /
  query-cache / test-databases / database-configurations suites pass.
