---
title: "Adapter-keyed maps typed Record<string,T> hide rename drift from tsc"
status: ready
updated: 2026-09-05
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

PR #7391 renamed the canonical type-registry keys to Rails' registry spellings
(`postgresql` / `mysql2` / `sqlite3`, per
`vendor/rails/activerecord/lib/active_record/connection_adapters.rb:67-70` and
`type.rb:49-51`). Two maps that were keyed by `adapter.typeRegistryKey` but
typed `Record<string, T>` silently stopped matching after that rename, because
a `string` key hides the drift from tsc:

- `ADAPTER_SPECIFIC_SCHEMAS` (`support/load-schema-helper.ts:431-435`) fell to
  `undefined`, so no adapter-specific schema loaded.
- `SHAPE_QUERIES` (`support/schema-cache-dump.ts:70-79`) fell to `[]`, so every
  table fingerprinted as `missing-table` and canonical tables were left
  unreflected.

Both were fixed in #7391 and are now `Record<AdapterName, T>`. The same latent
shape remains in maps that are NOT currently indexed by `typeRegistryKey`, so
they are not bugs today but are the identical landmine for the next rename:

- `NATIVE_DATABASE_TYPES_BY_ADAPTER`
  (`connection-adapters/abstract/native-database-types.ts:99-106`) — keys
  `sqlite` / `postgres` / `mysql2`.
- `ar-config.ts:29-34, :58-60` — adapter alias and client-binary maps.
- `support/config.ts:13-15` — adapter-name to CI-lane map.

The last two are the CI-lane / adapter-arg vocabulary, which is a genuinely
separate concept from the type-registry key and must stay separate; the problem
is that nothing in the types says so, so the three vocabularies read as
interchangeable at a glance.

## Converged shape

- Type every adapter-keyed map explicitly: `Record<AdapterName, T>` where the
  key is the registry key, and a distinct named lane type where the key is the
  CI lane, so a future rename is a tsc error rather than a silent lookup miss.
- Re-key `NATIVE_DATABASE_TYPES_BY_ADAPTER` onto `AdapterName` (it is the
  registry vocabulary, just not currently indexed by it).
- Leave the lane vocabulary's VALUES alone; only name and type it.

## Acceptance criteria

- No `Record<string, ...>` in the activerecord tree is keyed by an adapter name.
- `NATIVE_DATABASE_TYPES_BY_ADAPTER` is `Record<AdapterName, NativeDatabaseTypes>`.
- The CI-lane vocabulary carries its own exported named type, distinct from
  `AdapterName`.
