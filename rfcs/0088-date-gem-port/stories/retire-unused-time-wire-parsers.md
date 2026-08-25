---
title: "Delete the time wire parsers left with no caller after Type::Time casts the raw string"
status: done
updated: 2026-08-07
rfc: "0088-date-gem-port"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 6176
claim: "2026-08-07T15:54:17Z"
assignee: "i18n-load-yml-json-take-the-psych4-arm"
blocked-by: null
closed-reason: null
---

## Context

PR #6154 stopped intercepting the driver-level `time` types so the raw string
reaches `ActiveRecord::Type::Time#cast_value`, which is where Rails casts it
(`activemodel/lib/active_model/type/time.rb:68-83`):

- `packages/activerecord/src/connection-adapters/postgresql/temporal-type-parsers.ts`
  no longer maps `OID_TIME` (1083) or `OID_TIMETZ` (1266).
- `packages/activerecord/src/connection-adapters/mysql/temporal-type-cast.ts`
  no longer has a `TIME` / `TIME2` arm.

That left three wire parsers in
`packages/activerecord/src/connection-adapters/abstract/temporal-wire.ts` with
no production caller:

- `parsePostgresTime`
- `parsePostgresTimeTz` (and with it the `TimeTzValue` type)
- `parseMysqlTime`

They still carry their own tests, so they read as live surface. They were left
in place in #6154 to keep that PR's blast radius to the cast change; nothing
depends on them now.

Verify before deleting — `rg 'parsePostgresTime|parsePostgresTimeTz|parseMysqlTime|TimeTzValue'`
should show only the definitions, their tests, and the re-export barrel.

Note `normalizeTime24` is shared with other parsers; check its remaining callers
rather than deleting it along with `parsePostgresTime`.

## Acceptance criteria

- [ ] `parsePostgresTime`, `parsePostgresTimeTz`, `parseMysqlTime` and the
      `TimeTzValue` type are deleted from `temporal-wire.ts`, along with any
      barrel re-exports.
- [ ] Their tests in `connection-adapters/abstract/*.test.ts`,
      `postgresql/temporal-type-parsers.test.ts` and
      `mysql/temporal-type-cast.test.ts` go with them — the behaviour they
      covered is now `Type::Time#cast_value`'s, already tested there.
- [ ] `normalizeTime24` kept or removed according to its remaining callers.
- [ ] `pnpm parity:api:extra --package activerecord` clean; PG and MySQL lanes green.
