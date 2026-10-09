---
title: "activerecord: a dump-loaded schema cache verifies the connection before loadSchemaBang, so a failed connect raises the connection error"
status: draft
updated: 2026-10-09
rfc: "0174-activerecord-api-parity-100"
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

`PostgreSQL::Quoting#lookup_cast_type_from_column` (`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/postgresql/quoting.rb:189-192`) runs `verify! if type_map.nil?`, so on an unreachable server the caller gets `ConnectionNotEstablished` from `verify!`.

trails' `lookupCastTypeFromColumn` (`packages/activerecord/src/connection-adapters/postgresql/quoting.ts`) is synchronous. Since trails#8711 it starts `verifyBang`, drops its rejection, and the lookup raises `TypeError` off the unset map. `packages/activerecord/CLAUDE.md` § "Adapter facts are prewarmed and peeked" records that, and says a caller that can reach the lookup on an unverified connection warms first. Only `buildFixtureSql` (`connection-adapters/abstract/database-statements.ts`) does.

The other cold path has no warm step: a schema cache loaded from a dump file lets `loadSchemaBang` → `typeForColumn` (`packages/activerecord/src/model-schema.ts`) reach `lookupCastTypeFromColumn` on a connection nothing has verified. The user sees `TypeError: Cannot read properties of null (reading 'lookup')` and the connection error is discarded.

## Acceptance criteria

- [ ] The awaited step that precedes `loadSchemaBang` on a dump-loaded schema cache verifies the connection when its type map is unset, so an unreachable server raises the connection error Rails raises.
- [ ] A test loads a schema cache from a dump, makes `verifyBang` reject, and asserts the connection error class, not `TypeError`.
- [ ] The section names every warm step; `pnpm parity:api:calls` stays green for `postgresql/quoting.ts`.
