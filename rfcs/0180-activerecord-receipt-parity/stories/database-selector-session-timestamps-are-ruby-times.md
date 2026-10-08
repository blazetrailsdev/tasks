---
title: "activerecord: DatabaseSelector::Resolver::Session converts timestamps through Time.at and Time.now"
status: done
updated: 2026-10-08
rfc: "0180-activerecord-receipt-parity"
cluster: findings
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: trails#8666
claim: "2026-10-07T23:34:20Z"
assignee: "connection-handler-pool-manager-map-onto-concurrent-map"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by the `activerecord-audit-permanent-receipts-subsystems-part-1` audit: the receipts below were `PERMANENT`, no CLAUDE.md section ratifies them, and they are re-tagged `CONVERGEABLE` onto this story.

`Resolver::Session` converts between a session timestamp and a `Time`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/middleware/database_selector/resolver/session.rb:19-26,34-40`):

```ruby
def self.convert_time_to_timestamp(time)
  time.to_i * 1000 + time.usec / 1000
end

def self.convert_timestamp_to_time(timestamp)
  timestamp ? Time.at(timestamp / 1000, (timestamp % 1000) * 1000) : Time.at(0)
end
```

`packages/activerecord/src/middleware/database-selector/resolver/session.ts` types the time as
`Temporal.Instant`: `convertTimeToTimestamp` returns `time.epochMilliseconds`,
`convertTimestampToTime` returns `Temporal.Instant.fromEpochMilliseconds(…)` and carries
`@missingRailsCall at`, and `updateLastWriteTimestamp` reads `Temporal.Now.instant()` and carries
`@missingRailsName now` (that second receipt is listed by
`activerecord-audit-permanent-receipts-subsystems-part-2`).

`@blazetrails/date` ports Ruby's `Time` (`packages/date/src/time.ts`) with `Time.at(time, subsec)`,
`Time.now`, `#toI`, `#usec` and `#minus`, so nothing blocks the Rails bodies. The one consumer is
`Resolver#time_since_last_write_ok?`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/middleware/database_selector/resolver.rb:86-88`),
`Time.now - context.last_write_timestamp >= send_to_replica_delay`, which
`middleware/database-selector/resolver.ts` writes as a subtraction of two `epochMilliseconds` against a
millisecond `delay`; Rails' delay is a Duration (`resolver.rb:20`, `2.seconds`).

## Acceptance criteria

- [ ] `convertTimeToTimestamp` is `time.toI() * 1000 + Math.trunc(time.usec / 1000)` over a ruby `Time`; `convertTimestampToTime` is the `Time.at(…)` ternary; `updateLastWriteTimestamp` passes `Time.now()`.
- [ ] `ResolverContext#lastWriteTimestamp` returns a `Time`, and `isTimeSinceLastWriteOk` is `Time.now().minus(this.context.lastWriteTimestamp()) >= this.sendToReplicaDelay()` with the delay in Rails' unit.
- [ ] `@missingRailsCall at` and `@missingRailsName now` are deleted; `pnpm parity:api:calls`, `:calls:args` and `:receipts:gate` are green.
- [ ] The database-selector tests pass with Rails' assertions.

## Verification

```bash
pnpm vitest run packages/activerecord/src/middleware && API_COMPARE_FORCE=1 pnpm parity:api --calls && pnpm parity:api:calls && pnpm parity:api:calls:args && pnpm parity:api:receipts:gate
```
