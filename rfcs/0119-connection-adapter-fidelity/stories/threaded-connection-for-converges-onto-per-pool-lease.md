---
title: "threadedConnectionFor converges onto the model pool's own lease"
status: draft
updated: 2026-09-11
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`threadedConnectionFor` (`packages/activerecord/src/connection-handling.ts`,
`@internal @noRailsEquivalent CONVERGEABLE`) returns the execution-context-scoped
query connection only when it equals `connectionPool.call(modelClass).activeConnection`.
trails#7679 removed its `_adapter` guard; the function itself survives, and the
receipt was kept because dropping `@internal` would raise `extra:gate` novel.

Ruby needs no such helper: the lease is per pool
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/connection_pool.rb`
`lease_connection` / `active_connection`), so `Model.with_connection` /
`connection_pool.active_connection` already yields the model's own connection
(`connection_handling.rb:309-311`).

Callers: `model-schema.ts` (`reflectionAdapter`, `cachedColumnsHash`,
`loadSchemaFromAdapter`) and any other `threadedConnectionFor(` site.

## Converged shape

Callers read the model's pool (`connectionPool.call(klass).activeConnection` /
`withConnectionSync`) directly, as `attributes.ts` `_defaultAttributes` already does
after #7679 (`attributes.rb:241-253`). `threadedConnectionFor` and its receipt are
deleted.

## Acceptance criteria

- [ ] `threadedConnectionFor` and its `@noRailsEquivalent` receipt are deleted.
- [ ] Every former caller resolves through the model's pool with no
      execution-context comparison.
- [ ] Three AR adapter lanes green; `parity:api:extra:gate` novel does not rise.
