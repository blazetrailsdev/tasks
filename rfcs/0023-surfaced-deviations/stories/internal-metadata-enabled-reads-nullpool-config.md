---
title: "internal-metadata-enabled-reads-nullpool-config"
status: done
updated: 2026-08-09
rfc: "0023-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6270
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`InternalMetadata#enabled` (`packages/activerecord/src/internal-metadata.ts:98`)
deviates from Rails' `@pool.db_config.use_metadata_table?`
(`vendor/rails/activerecord/lib/active_record/internal_metadata.rb:35-36`): it
reads the flag through an optional cast and treats an absent flag as enabled
(`dbConfig?.useMetadataTable !== false`).

The reason is that trails builds `InternalMetadata` over bare, `NullPool`-backed
adapters (the test suite, the trailties `db` commands). `NullPool#dbConfig`
answers `NULL_CONFIG`, whose every key is undefined
(`connection-adapters/abstract/connection-pool.ts:63-70`, mirroring
`abstract/connection_pool.rb:17-22`), so the faithful body would read those call
sites as disabled and silently skip `createTable` / `[]=`.

`migration-context-collaborators-need-a-pool` (PR #6268) fixed the
`MigrationContext` half of this — it defaults its collaborators off a real pool
now — but the remaining `NullPool`-backed construction sites keep the guard
alive.

## Acceptance criteria

- `enabled` reads `this._pool.dbConfig.useMetadataTable` with no optional
  chaining and no `!== false` default.
- The remaining call sites that build an `InternalMetadata` over a `NullPool`
  are converged to hold a real pool (or shown not to exist).
- The `Deviation:` paragraph on `enabled` is deleted, not reworded.

## Definition of done

Green AR suite on all lanes; no new baseline rows.

## Verification

`pnpm vitest run packages/activerecord/src/internal-metadata.test.ts packages/activerecord/src/migration.test.ts`
