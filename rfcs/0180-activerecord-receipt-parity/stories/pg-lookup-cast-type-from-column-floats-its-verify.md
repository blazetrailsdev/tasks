---
title: "activerecord: PG lookupCastTypeFromColumn starts verify! with no handler, so a failed connect is an unhandled rejection"
status: ready
updated: 2026-10-09
rfc: "0180-activerecord-receipt-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`PostgreSQL::Quoting#lookup_cast_type_from_column` (`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/postgresql/quoting.rb:189-192`) runs `verify! if type_map.nil?` and then looks the type up.

trails' `lookupCastTypeFromColumn` (`packages/activerecord/src/connection-adapters/postgresql/quoting.ts`) is synchronous and writes that line as `if (this.typeMap == null) void this.verifyBang();`. trails#8695 recorded the shape in `packages/activerecord/CLAUDE.md` § "Adapter facts are prewarmed and peeked": the verify is started, and the lookup raises `TypeError` off the unset map.

The started promise has no handler. On a cold type map with an unreachable server, the caller sees the `TypeError`, and the rejected `verifyBang` then surfaces as an unhandled rejection, which ends a Node process by default. Rails raises `ConnectionNotEstablished` from `verify!` at that line.

The cold path is reachable when the schema cache was loaded from a dump file, so `loadSchemaBang` (`packages/activerecord/src/model-schema.ts`) reaches the lookup on a connection nothing has verified.

## Acceptance criteria

- [ ] A cold `lookupCastTypeFromColumn` on a connection that cannot connect leaves no unhandled rejection; a test with a failing `verifyBang` shows it.
- [ ] The error the caller sees on the cold path is decided and recorded in the section: the `TypeError` off the unset map, or the connection error Rails raises.
- [ ] `pnpm parity:api:calls` stays green for `postgresql/quoting.ts`; the `verify!` call is kept or receipted.
