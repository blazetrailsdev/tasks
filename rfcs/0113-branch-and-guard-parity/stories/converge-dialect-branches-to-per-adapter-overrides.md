---
title: "Converge the typeRegistryKey dialect branches to per-adapter overrides and delete the getter"
status: done
updated: 2026-09-05
rfc: "0113-branch-and-guard-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 300
priority: 33
pr: 7523
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Filed from #7153 (RFC 0113,
`adapter-name-getter-conflates-rails-adapter-name-with-type-registry-key`),
which separated Rails' `ADAPTER_NAME` display name from the type-registry key
and introduced `AbstractAdapter#typeRegistryKey`
(`packages/activerecord/src/connection-adapters/abstract-adapter.ts`) to carry
the latter. That getter is invented surface, tagged
`@noRailsEquivalent CONVERGEABLE`, and this is the story the receipt promises.

Rails has no adapter-instance reader for the registry key, because Rails does
not branch on the dialect at all: where trails writes
`if (this.typeRegistryKey === "mysql2")`, Rails defines the method on
`AbstractAdapter` and **overrides it per adapter**. `Type.adapter_name_from`
(`activerecord/lib/active_record/type.rb:49-51`) exists only to pick a type
registration namespace, and is
`model.connection_db_config.adapter.to_sym` — it is never a dispatch
discriminator.

The dialect branches that now read `typeRegistryKey`, all of which are the real
deviation:

- `insert-all.ts` — two branches; Rails puts this on the adapter
  (`build_insert_sql`, `activerecord/lib/active_record/connection_adapters/
abstract/database_statements.rb`, and the mysql2/postgresql overrides).
- `connection-adapters/abstract/schema-statements.ts:457` (a `mysql2` guard)
  and `:870` (a three-way switch).
- `relation/calculations.ts` — a `sqlite` guard.
- `support/{canonical-schema,canonical-table-rebuild,drop-all-tables,
load-schema-helper,schema-cache-dump,schema-file-generator}.ts` — trails test
  support, no Rails counterpart, so these converge to adapter capability
  predicates rather than to a Rails body.
- `trailties/src/schema-source.ts` — `detectAdapter`.
- `fixtures.ts:720` — a `postgres` guard around `resetPkSequence`.

## Converged shape

Each branch becomes a method on `AbstractAdapter` with per-adapter overrides,
named after whatever Rails calls the behaviour at that site — the pattern
`supportsX?` / `buildY` already used elsewhere in the adapter tree. Once no
call site needs to ask "which dialect am I?", `typeRegistryKey` loses its only
consumers except `Type.adapterNameFrom`, and the getter and its three overrides
are deleted, taking the `@noRailsEquivalent` receipt with them.

Expect to split this per call-site cluster (insert-all; schema-statements;
test support; trailties) rather than landing it as one PR — the est-loc below
is the whole burndown.

Note the sites in `support/**` and `trailties/**` have no Rails counterpart, so
they are the weakest part of the case: converging them is about removing the
dialect discriminator, not about matching a Ruby body.

## Acceptance criteria

1. No production call site reads `typeRegistryKey` as a dialect discriminator;
   each is a per-adapter method override.
2. `AbstractAdapter#typeRegistryKey` and its `SQLite3Adapter` /
   `PostgreSQLAdapter` / `AbstractMysqlAdapter` overrides are deleted, along
   with their `@noRailsEquivalent CONVERGEABLE` receipts.
3. `Type.adapterNameFrom` keeps deriving the registry key from
   `connection_db_config` per `type.rb:49-51`.
4. `pnpm parity:api:extra:gate` shows activerecord novel/total down, not up;
   all three adapter lanes green.

## Related

Overlaps but does not duplicate
`0119-connection-adapter-fidelity/type-adapter-name-normalization-collapses-rails-adapter-spellings`
(status: ready), which converges `adapterNameFromConfig`'s output spellings.
That one fixes what the key IS; this one removes the branches that read it.
