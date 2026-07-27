---
title: "MySQL max_allowed_packet: resolve from the server instead of a hardcoded 16 MiB default"
status: ready
updated: 2026-07-27
rfc: "0072-api-compare-parity-burndown"
cluster: arity-fidelity
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

`mysql/database_statements.rb:78` compares packet sizes against
`max_allowed_packet`, which memoizes `show_variable("max_allowed_packet")` — an
async server round-trip:

```ruby
def max_allowed_packet_reached?(current_packet, previous_packet)
  if current_packet.bytesize > max_allowed_packet ...
```

The trails port
(`packages/activerecord/src/connection-adapters/mysql/database-statements.ts:135`)
takes `maxPacket` as a third parameter because its only caller,
`combineMultiStatements`, is synchronous and hardcodes the 16 MiB MySQL default:

```ts
// Rails reads max_allowed_packet lazily from the server; we use the MySQL default (16 MiB).
const maxPacket = 16_777_216;
```

A server configured below 16 MiB will therefore build an over-long multi-statement
and fail at execution rather than splitting. An async `maxAllowedPacket()` helper
already exists in the same file but is unused by this path.

Excluded in `scripts/api-compare/arity-exclude.json` (see PR #5340).

## Acceptance criteria

- `combineMultiStatements` becomes async (or its caller resolves the limit first)
  so the real server `max_allowed_packet` is used and memoized.
- `isMaxAllowedPacketReached` drops the `maxPacket` param and reads it off the
  receiver, matching `(current_packet, previous_packet)`.
- The entry is removed from `arity-exclude.json`.
