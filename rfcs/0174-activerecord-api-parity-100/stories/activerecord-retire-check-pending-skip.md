---
title: "activerecord: retire SKIP_GROUPS' CheckPending entry, which hides ModelSchema.load_schema!"
status: ready
updated: 2026-09-30
rfc: "0174-activerecord-api-parity-100"
cluster: skips
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 350
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`SKIP_GROUPS[8]` skips `any_schema_needs_update?`, `db_configs_in_current_env` and `load_schema!`
**globally** ("CheckPending helpers depend on Rails.root, system("bin/rails …") …"). `load_schema!` is
not only `Migration::CheckPending#load_schema!` (`vendor/rails/v8.0.2/activerecord/lib/active_record/migration.rb:776`): it is also
`ModelSchema::ClassMethods#load_schema!` (`vendor/rails/v8.0.2/activerecord/lib/active_record/model_schema.rb:587`, the method CLAUDE.md § "Schema
reflection peeks at a warm cache" is built around), `CounterCache#load_schema!` (`vendor/rails/v8.0.2/activerecord/lib/active_record/counter_cache.rb:186`)
and `EncryptableRecord#load_schema!` (`vendor/rails/v8.0.2/activerecord/lib/active_record/encryption/encryptable_record.rb:126`). None is scored.
`CheckPending` itself (`vendor/rails/v8.0.2/activerecord/lib/active_record/migration.rb:748-790`) is portable: trailties now has a Rails app root and
command runner.

## Acceptance criteria

- [ ] `SKIP_GROUPS[8]` is deleted. The four `load_schema!` definitions are scored against their TS ports (`loadSchemaBang`), and their call sets converge or are filed.
- [ ] `CheckPending#any_schema_needs_update?` / `db_configs_in_current_env` / `load_schema!` are ported in `migration.ts` over trailties' root and runner.
- [ ] `pnpm parity:api` activerecord global skip −6.
