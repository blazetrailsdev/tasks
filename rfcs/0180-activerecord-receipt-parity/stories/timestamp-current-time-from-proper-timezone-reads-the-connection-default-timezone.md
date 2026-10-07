---
title: "activerecord: current_time_from_proper_timezone reads default_timezone from the connection with_connection yields"
status: ready
updated: 2026-10-07
rfc: "0180-activerecord-receipt-parity"
cluster: findings
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by the `activerecord-audit-permanent-receipts-root-n-z` audit: the receipts below were `PERMANENT`, no CLAUDE.md section ratifies them, and they are re-tagged `CONVERGEABLE` onto this story.

`Timestamp::ClassMethods#current_time_from_proper_timezone`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/timestamp.rb:79-81`):

```ruby
with_connection { |c| c.default_timezone == :utc ? Time.now.utc : Time.now }
```

`packages/activerecord/src/timestamp.ts` `currentTimeFromProperTimezone` reads the module-level
`defaultTimezone()` and takes no connection, under `@missingRailsCall with_connection`. The adapter's
reader is `@default_timezone || ActiveRecord.default_timezone`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/abstract_adapter.rb:219-221`),
so the two differ for a connection configured with its own `default_timezone`.

trails' `withConnection` is async and this body is synchronous. CLAUDE.md ratifies an omitted
`with_connection` for `Relation#toSql` only (§ "`Relation` is evaluated by an async query"), and
§ "Schema reflection peeks at a warm cache" excludes every synchronous lease from its scope. Its
callers are mixed: `_createRecord` and `recordUpdateTimestamps` (`timestamp.ts`) are async, while
`touchAttributesWithTime` (`timestamp.ts`), `_touchRow` (`persistence.ts`), `touchLater`
(`touch-later.ts`) and the instance delegator (`timestamp.rb:159-161`) are synchronous bodies today.

## Acceptance criteria

- [ ] `currentTimeFromProperTimezone` reads `default_timezone` from the connection `withConnection` yields, and every caller awaits it; or, if a synchronous caller is found that cannot await, the story is blocked naming it. The receipt is deleted or stays `CONVERGEABLE` on the blocker, never `PERMANENT`.
- [ ] A trails test sets a per-connection `default_timezone` different from `ActiveRecord.default_timezone` and asserts the timestamp follows the connection, failing on the current body.
- [ ] `pnpm parity:api:calls` and `:receipts:gate` green; `packages/activerecord/src/timestamp.test.ts` stays green.
