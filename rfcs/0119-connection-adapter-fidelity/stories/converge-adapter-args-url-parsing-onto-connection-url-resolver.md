---
title: "converge-adapter-args-url-parsing-onto-connection-url-resolver"
status: done
updated: 2026-09-06
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 7539
claim: "2026-09-05T22:06:49Z"
assignee: "converge-adapter-args-url-parsing-onto-connection-url-resolver"
blocked-by: null
closed-reason: null
---

## Context

`packages/activerecord/src/connection-adapters/adapter-args.ts` hand-rolls URL
parsing that Rails already does in
`activerecord/lib/active_record/database_configurations/connection_url_resolver.rb`,
which trails HAS ported at
`packages/activerecord/src/database-configurations/connection-url-resolver.ts`.

Two functions duplicate it, plus one already registered elsewhere:

- `inferAdapterNameFromUrl` — Rails reads the adapter off `uri.scheme` in
  `ConnectionUrlResolver#to_hash` and normalizes it there; it has no "guess the
  adapter from a `.sqlite3` suffix" arm at all. It already carries a
  `CONVERGEABLE inline-ruby-bodies-extracted-as-named-helpers` receipt; its
  public wrapper `adapterNameFromUrl` was dead and is deleted by
  `receipt-connection-adapters-and-sqlite-drivers`.
- `parseSqliteUrl` — Rails' resolver produces `database:` from the URI path
  (`connection_url_resolver.rb`), and `SQLite3Adapter.new_client` handles
  `:memory:` / `file:` through `SQLITE_OPEN_URI` (`sqlite3_adapter.rb:34`).
- `normalizeAdapterName` — an alias table with entries Rails does not have
  (`node-sqlite`, `expo-sqlite`, `libsql-remote`, `libsql-replica`). Rails'
  adapter name is whatever `resolve_config` produced; `AdapterNotFound` is
  raised by `resolve` when no adapter registered under it.

They carry `@noRailsEquivalent CONVERGEABLE` receipts pointing here (RFC 0130,
`receipt-connection-adapters-and-sqlite-drivers`).

`buildAdapterArg` in the same file is NOT in scope — it turns a config hash into
the positional constructor arguments of a Node driver package, which Ruby (one
gem per adapter, keyword-configured) has no counterpart for; it carries a
`PERMANENT` receipt.

## Acceptance criteria

- The URL/adapter-name helpers are gone, their call sites routed through
  the ported `ConnectionUrlResolver` (and `AdapterNotFound` raised where Rails
  raises it).
- The driver-alias table either moves to where trails registers its SQLite
  drivers or is shown to be dead.
- Their `@noRailsEquivalent CONVERGEABLE` receipts are deleted with them;
  `pnpm parity:api:extra --package activerecord --novel-only` shows
  `connection-adapters/adapter-args.ts` at 1 novel (`buildAdapterArg`).
- The three AR adapter lanes stay green.
