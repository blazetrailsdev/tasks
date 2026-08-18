---
title: "MySQL/PostgreSQL TypeMetadata bypass the Deduplicable registry"
status: closed
updated: 2026-08-18
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "merged into column-bypasses-deduplicable-registry — one mechanism (deduplicable.rb:13-18 registry[self] ||= deduplicated); Column needs the deduplicateKey the TypeMetadata overrides ride on, so they converge together"
---

## Context

`MySQL::TypeMetadata#deduplicate` and `PostgreSQL::TypeMetadata#deduplicate`
(`packages/activerecord/src/connection-adapters/mysql/type-metadata.ts:62`,
`connection-adapters/postgresql/type-metadata.ts:61`) each override the mixin
with `return this.deduplicated();` — they never touch the Deduplicable
registry. Rails has no such override: `Deduplicable#deduplicate` is
`self.class.registry[self] ||= deduplicated`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/deduplicable.rb:18`),
so every including class shares one registry and identical metadata objects
collapse to a single frozen instance.

The overrides exist because neither class implements `deduplicateKey()`, which
the trails port of `deduplicate`
(`connection-adapters/deduplicable.ts:31`) needs to build its Map key —
`SqlTypeMetadata` does implement it (`sql-type-metadata.ts:37`) and goes through
the shared path. So the two adapter subclasses silently opt out of dedup.

Surfaced by PR #5406, which routed `deduplicate` through `registry()` to match
Rails and had to baseline these two in the wide call gate
(`scripts/api-compare/call-mismatches-wide-exclude/activerecord/connection-adapters/{mysql,postgresql}/type-metadata.json`).

## Acceptance criteria

- Both `TypeMetadata` classes implement `deduplicateKey()` (they already have a
  `hashKey()` that enumerates exactly the right fields) and drop the
  `deduplicate` override so the mixin's registry path applies, as in Rails.
- The two wide-gate baseline entries for `deduplicate` -> `registry` are DELETED,
  not re-reasoned.
- `pnpm parity:api:calls` OK; adapter column/type-reflection tests green on
  mysql2 and postgresql.
