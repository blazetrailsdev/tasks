---
title: "Converge connection-adapters-slot.ts onto the ConnectionAdapters autoload namespace"
status: draft
updated: 2026-09-24
rfc: "0151-activesupport-autoload-slot-registry"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#8033 added the `ActiveRecord::ConnectionAdapters` autoload namespace to
`packages/activerecord/src/namespaces.ts` (it seats `ConnectionPool`, per
`connection_adapters.rb:107-110`). `packages/activerecord/src/connection-adapters-slot.ts`
still holds `ConnectionAdapters.resolve` as a zero-import slot, read by
`database-configurations/database-config.ts` for `DatabaseConfig#adapter_class`
(`database_config.rb:17`, `ActiveRecord::ConnectionAdapters.resolve(adapter)`).
Rails defines `register`/`resolve` as singleton methods of the `ConnectionAdapters`
module itself (`connection_adapters.rb:22-50`).

`rewrite-call-time-constant-resolution-onto-autoload` is blocked on this slot
having no converging story.

## Acceptance criteria

- `resolve` (and `register`) are reachable as `ConnectionAdapters.resolve` on the
  namespace object in `namespaces.ts`, seated by `connection-adapters.ts`.
- `database-config.ts` reads `ConnectionAdapters.resolve` at call time;
  `connection-adapters-slot.ts` is deleted and CLAUDE.md § "Call-time constant
  resolution" drops its entry.
- `node -e "import('./dist/database-configurations/hash-config.js')"` and
  `connection-adapters.js` both load as entry modules.
