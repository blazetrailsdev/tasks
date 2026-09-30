---
title: "activerecord: AdapterSpecificRegistry#initialize_copy and Type::Serialized#inspect"
status: ready
updated: 2026-09-30
rfc: "0174-activerecord-api-parity-100"
cluster: api-surface
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 100
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Two value-protocol misses under `type/`:

- `Type::AdapterSpecificRegistry#initialize_copy` (`vendor/rails/v8.0.2/activerecord/lib/active_record/type/adapter_specific_registry.rb:11`)
  — `@registrations = @registrations.dup`; without it a dup'd registry (`ActiveRecord::Type.registry.dup`
  in adapter setup) shares its table.
- `Type::Serialized#inspect` (`vendor/rails/v8.0.2/activerecord/lib/active_record/type/serialized.rb:33`).

## Acceptance criteria

- [ ] Both ported in their mirroring files; `dup()` on the registry calls `initializeCopy`.
- [ ] `type/adapter_specific_registry.rb` and `type/serialized.rb` score 100%.

## Verification

```bash
pnpm build && pnpm parity:api && pnpm parity:api:calls && pnpm parity:api:calls:args
```
