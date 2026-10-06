---
title: "activerecord: port TrilogyAdapter (un-exclude trilogy_adapter.rb and adapters/trilogy)"
status: closed
updated: 2026-10-06
rfc: "0183-activerecord-excluded-source-files"
cluster: excluded-files
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 650
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: 'Out of scope, permanently: Trilogy has no Node client and will not be ported. Ratified in trails CLAUDE.md § "Trilogy is out of scope" (trails#8579); the unported-files rows for trilogy_adapter.rb and adapters/trilogy are PERMANENT, not burndown debt. Do not re-file.'
---

## Context

`connection_adapters/trilogy_adapter.rb` and `connection_adapters/trilogy/database_statements.rb` are
excluded ("Trilogy is a C extension for Ruby with no Node.js equivalent"), and the per-adapter
`database_tasks_test.rb` cases (`trilogy create/drop/purge/charset/collation/structure dump/load`) are
missing for the same reason. `vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/trilogy_adapter.rb` is an `AbstractMysqlAdapter`
subclass whose only driver-specific surface is `new_client` / error translation over the `trilogy` gem.

The convention for gem-backed adapters is to wrap an npm client async from the start. No npm client
binds the trilogy C library, and routing a `TrilogyAdapter` through the `mysql2` npm driver would be a
second `Mysql2Adapter` wearing Rails' name, not a port.

## Acceptance criteria

- [ ] A JS client exposing trilogy's API exists (published binding, or a wire-protocol client with trilogy's error classes), `TrilogyAdapter` wraps it, and both exclusions are deleted.
- [ ] The eight trilogy `database_tasks_test.rb` cases are ported.

## Verification

```bash
pnpm build && pnpm parity:api && pnpm parity:skips:stories && pnpm parity:api:calls
```
