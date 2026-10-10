---
title: "activerecord: quoted_date takes Ruby-shaped receivers, not a Temporal union with private dispatch helpers"
status: blocked
updated: 2026-10-10
rfc: "0174-activerecord-api-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 400
priority: null
pr: null
claim: "2026-10-10T12:09:35Z"
assignee: "migration-lacks-transaction-and-execute-forwarders"
blocked-by: "Owner decision needed: the premise that @blazetrails/date's Date/DateTime carry isUtc/getutc/getlocal/usec/to_fs is false. trails spells Ruby Date as Temporal.PlainDate (activemodel/src/type/date.ts DateCastResult; date/src/date.ts Date#toDate) and DateTime as Temporal.PlainDateTime|ZonedDateTime, with to_fs/usec/utc?/getutc/localtime ported as FREE FUNCTIONS over those types (activesupport/src/core-ext/date/conversions.ts:21, date-time/conversions.ts:9,74, date-time/calculations.ts:204,219,238); Time has no toFs method either (core-ext/time/conversions.ts:52). So quotedDate cannot call 'the receiver's own' toFs for Time/Date/DateTime, and the private dispatchers exist because of that representation. Converging as written means either adding the AS core-ext methods to the date-package classes and switching AR's Date/DateTime cast values to them (repo-wide), or re-scoping the story to: drop JS Date + Temporal.Instant from the union, keep PlainDate/DateTime as the Date receivers, and dispatch through activesupport's exported free functions."
closed-reason: null
---

## Context

Surfaced by the review of trails#8704, which folded `sql-datetime.ts` into `Quoting#quoted_date`.

`Quoting#quoted_date`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/abstract/quoting.rb:184-198`)
dispatches on its receiver: `value.acts_like?(:time)`, `value.utc?`, `value.getutc`,
`value.getlocal`, `value.to_fs(:db)`, `value.respond_to?(:usec)`, `value.usec`. Its `value` is a
`Time`, an `ActiveSupport::TimeWithZone`, a `DateTime` or a `Date`.

`packages/activerecord/src/connection-adapters/abstract/quoting.ts` types `value` as
`TemporalDateLike`: `TimeWithZone | Time | Date (JS) | Temporal.Instant | Temporal.ZonedDateTime |
Temporal.PlainDateTime | Temporal.PlainDate`. The Temporal types and the JS `Date` carry none of
those methods, so the file holds seven module-private functions that stand in for the receiver
dispatch: `actsLikeTime`, `instantOf`, `isUtc`, `getutc`, `getlocal`, `toFs` and `usec`.
`packages/activerecord/src/connection-adapters/postgresql/quoting.ts` holds an eighth, `year`, for
`value.year` (`postgresql/quoting.rb:144`). They are private, so no gate measures them and no JSDoc
receipt can sit on them (`parity:api:receipts:gate` reds a receipt on a declaration the extractor
does not surface).

`@blazetrails/date` already ports `Time`, `Date` and `DateTime`, and activesupport ports
`TimeWithZone`; each carries `isUtc` / `getutc` / `getlocal` / `usec` / `year` and a `to_fs`.

## Acceptance criteria

- [ ] `quotedDate` / `quotedTime` take the Ruby-shaped receivers only (`Time`, `TimeWithZone`,
      `DateTime`, `Date` from `@blazetrails/date` / activesupport), and every caller that passes a
      Temporal value or a JS `Date` converts at its own boundary.
- [ ] `quotedDate`'s body calls the receiver's own `isUtc` / `getutc` / `getlocal` / `toFs` / `usec`,
      and the seven private functions in `abstract/quoting.ts` and `year` in `postgresql/quoting.ts`
      are deleted.
- [ ] `pnpm parity:api:calls` and `pnpm parity:api:calls:args` green with no new row;
      `packages/activerecord/src/quoting.test.ts` and the quoting trails tests stay green.

## Verification

```bash
pnpm parity:api:calls && pnpm vitest run packages/activerecord/src/quoting.test.ts
```
