---
title: "activerecord: Trilogy is out of scope (trilogy_adapter.rb and adapters/trilogy stay excluded)"
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

**Decided 2026-10-06: Trilogy is not ported, permanently.** The decision is ratified in trails
CLAUDE.md § "Trilogy is out of scope" (trails#8579), which is where a reader meets it; this story is
closed and exists only as the record.

`connection_adapters/trilogy_adapter.rb` and `connection_adapters/trilogy/database_statements.rb` are
excluded ("Trilogy is a C extension for Ruby with no Node.js equivalent"). The per-adapter
`database_tasks_test.rb` cases (`trilogy create/drop/purge/charset/collation/structure dump/load`) are
NOT in that set: they only route the `"trilogy"` adapter string to `MySQLDatabaseTasks` against a
stubbed task object, so they port with their siblings
(`activerecord-port-database-tasks-per-adapter-cases`). `vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/trilogy_adapter.rb` is an `AbstractMysqlAdapter`
subclass whose only driver-specific surface is `new_client` / error translation over the `trilogy` gem.

The convention for gem-backed adapters is to wrap an npm client async from the start. No npm client
binds the trilogy C library, and routing a `TrilogyAdapter` through the `mysql2` npm driver would be a
second `Mysql2Adapter` wearing Rails' name, not a port. MySQL goes through `Mysql2Adapter`.

## Acceptance criteria

- [x] The decision is recorded in trails CLAUDE.md, so nobody re-derives it.
- [x] The `trilogy_adapter.rb` and `adapters/trilogy` rows in `scripts/parity/unported-files/unscoped.ts`
      say PERMANENT and cite that section, rather than reading as burndown debt.
- [x] This story is closed, and 0174 / 0175 / 0183 name Trilogy as decided-not-ported rather than blocked.

## Non-goals

Porting `TrilogyAdapter`, now or when a JS client appears. Do not re-file this story.
