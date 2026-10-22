---
title: "bulkChangeTable dispatches through rbObjRespondTo/rbFSend, not an any-cast index"
status: closed
updated: 2026-10-22
rfc: "0198-activerecord-mixin-host-typing"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: 1
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "don't want this, prefer any-cast index"
---

## Context

Rails `SchemaStatements#bulk_change_table`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/abstract/schema_statements.rb:1563-1572`)
dispatches each recorded command with `respond_to?(method, true)` and
`send(method, table, *arguments)` / `send(command, table, *arguments)`.

trails' `bulkChangeTable` (`packages/activerecord/src/connection-adapters/abstract/schema-statements.ts:~1285-1305`)
spells the probe as `typeof (this as any)[method] === "function"` and the calls as
`(this as any)[method](...)` / `(this as any)[command](...)`. That shape is not
Rails' and is also the last group of `as any` casts left in the file after
trails#9073 (RFC 0198).

## Acceptance criteria

- [ ] The probe is `rbObjRespondTo(this, method, true)` and both calls are `rbFSend(this, …)` (ruby-compat), mirroring `respond_to?` / `send` at schema_statements.rb:1563-1572.
- [ ] The three `as any` casts at those sites are gone.
- [ ] `pnpm parity:api:calls` / `calls:args` green; bulk-alter tests (`bulk_alter_test`-derived) pass on all three adapters.
