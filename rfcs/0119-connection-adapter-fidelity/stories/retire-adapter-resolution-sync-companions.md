---
title: "retire-adapter-resolution-sync-companions"
status: done
updated: 2026-09-06
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 7566
claim: "2026-09-06T17:18:15Z"
assignee: "retire-adapter-resolution-sync-companions"
blocked-by: null
closed-reason: null
---

## Context

Ruby resolves an adapter synchronously because `require` is synchronous
(`vendor/rails/activerecord/lib/active_record/connection_adapters.rb:26-64`), so
`DatabaseConfig#adapter_class` (`database_config.rb:17-19`) and
`#new_connection` (`:25-27`) are plain methods. trails loads adapters through a
dynamic `import()`, so the same surface is split into an async resolver plus a
set of synchronous companions that read what a previous `resolve()` cached:

- `resolveSync`, `resolveSyncError`, `validateAdapterName`
  (`packages/activerecord/src/connection-adapters.ts`)
- `adapterClassSync`, `loadAdapter`
  (`packages/activerecord/src/database-configurations/database-config.ts`)

Every one of them carries a `@noRailsEquivalent` receipt naming this split.
`adapter-not-found-message-duplicated-by-sync-companion` (PR #7243) removed the
duplicated AdapterNotFound message between `resolve` and `validateAdapterName`
but left the companions themselves, since retiring them means making the
callers async: `ConnectionPool.newConnection` → `dbConfig.newConnection`, and
`DatabaseConfig#validateBang`, which `ConnectionHandler.resolvePoolConfig`
(`connection-handler.ts:344`) calls synchronously where Ruby's `validate!`
(`database_config.rb:29-33`) is synchronous too.

This is the register those receipts point at. It converges with the pool
async/sync surface work — see
`async-overrides-of-synchronous-rails-adapter-methods` and RFC 0073.

## Acceptance criteria

- [ ] `dbConfig.newConnection` reaches the async `resolve` (or the checkout path
      that calls it awaits the adapter first), so `resolveSync` /
      `adapterClassSync` / `loadAdapter` have no callers.
- [ ] `validateAdapterName` and `resolveSyncError` retire with them; the
      AdapterNotFound raise stays inline in `resolve`
      (connection_adapters.rb:34-39), where Rails writes it.
- [ ] The five `@noRailsEquivalent` receipts naming this split are deleted, and
      `pnpm parity:api:extra --package activerecord` shrinks by them.
- [ ] Green on all three lanes.
