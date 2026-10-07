---
title: "activerecord: temporal-wire.ts's parsers fold into the OID and ActiveModel cast_value bodies"
status: ready
updated: 2026-10-07
rfc: "0180-activerecord-receipt-parity"
cluster: findings
packages: ["activerecord", "activemodel"]
deps: []
deps-rfc: []
est-loc: 450
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by the `activerecord-audit-permanent-receipts-ca-abstract` audit: the receipt below was `PERMANENT`, no CLAUDE.md section ratifies it, and it is re-tagged `CONVERGEABLE` onto this story.

`packages/activerecord/src/connection-adapters/abstract/temporal-wire.ts` has no Rails counterpart file and carries a file-level
`@noRailsEquivalent`. It exports `parsePostgresInstant`, `parsePostgresTimestampAsInstant`,
`parsePostgresDate`, `parseMysqlInstant`, `parseMysqlDatetimeAsInstant`, `parseMysqlDate`, and
re-exports `DateInfinity` / `DateNegativeInfinity`. Consumers:
`packages/activerecord/src/connection-adapters/postgresql/temporal-type-parsers.ts` and
`packages/activerecord/src/connection-adapters/mysql/temporal-type-cast.ts` (neither of which has a
Rails counterpart file either).

Rails does this work in the type objects, not in an adapter-level parser module:

- `vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/postgresql/oid/date_time.rb:8-18` and `vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/postgresql/oid/date.rb:8-18` — `cast_value`
  answers `::Float::INFINITY` for `"infinity"` / `"-infinity"`, rewrites a `" BC"` year
  (`format("%04d", -year.to_i + 1)`) and calls `super`.
- `super` is `ActiveModel::Type::DateTime#cast_value` / `Type::Date#cast_value`
  (`vendor/rails/v8.0.2/activemodel/lib/active_model/type/date_time.rb`, `type/date.rb`), through
  `Helpers::TimeValue#fast_string_to_time` (`type/helpers/time_value.rb`) and
  `Type::Date#fast_string_to_date`.
- MySQL's zero dates (`0000-00-00`) are answered `nil` by those same `fast_string_to_*` bodies
  (`new_date` / `new_time` return `nil` for a zero year/month/day), not by an adapter helper.

So each exported parser is one arm of a `cast_value` Rails already has a home for.

## Acceptance criteria

- [ ] `OID::DateTime#castValue` and `OID::Date#castValue` (`packages/activerecord/src/connection-adapters/postgresql/oid/date-time.ts`, `oid/date.ts`) hold Rails' `case` — the two infinity arms, the BC rewrite, `super` — and the string-to-Temporal parse lives in the ActiveModel `fastStringToTime` / `fastStringToDate` they call.
- [ ] The MySQL zero-date arm is `newDate` / `newTime`'s `nil` return, not `isZeroDate` / `isZeroDatetime`.
- [ ] `temporal-wire.ts` is deleted; its file-level receipt is gone and no receipt replaces it. If `postgresql/temporal-type-parsers.ts` / `mysql/temporal-type-cast.ts` still need a driver-level text hook, split that into its own story with the driver `file:line`.
- [ ] `pnpm parity:api:extra:gate` green (activerecord rowless).

## Verification

```bash
pnpm parity:api:extra:gate && pnpm vitest run packages/activerecord/src/adapters/postgresql/date.test.ts packages/activerecord/src/adapters/postgresql/timestamp.test.ts packages/activerecord/src/adapters/postgresql/infinity.test.ts packages/activerecord/src/date-time.test.ts
```
