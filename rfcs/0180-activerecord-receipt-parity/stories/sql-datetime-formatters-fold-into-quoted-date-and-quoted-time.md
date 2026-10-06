---
title: "activerecord: sql-datetime.ts's formatters fold into Quoting#quoted_date / quoted_time"
status: draft
updated: 2026-10-02
rfc: "0180-activerecord-receipt-parity"
cluster: findings
packages: ["activerecord"]
deps:
  - quoted-date-usec-arm-is-relocated-into-sql-datetime
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by the `activerecord-audit-permanent-receipts-ca-abstract` audit: the receipt below was `PERMANENT`, no CLAUDE.md section ratifies it, and it is re-tagged `CONVERGEABLE` onto this story.

`packages/activerecord/src/connection-adapters/abstract/sql-datetime.ts` has no Rails counterpart file and carries a file-level
`@noRailsEquivalent`. It exports `defaultSqlTimezone`, `formatPlainDateTimeForSql`,
`formatPlainDateForSql` and `formatPlainTimeForSql` (created by RFC 0010's
`relocate-datetime-serializers-from-quoting`, trails#3141, as a pure move out of `quoting.ts`).

Rails has exactly two bodies for this, both in `Quoting` (`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/abstract/quoting.rb:184-204`):

```ruby
def quoted_date(value)
  if value.acts_like?(:time)
    if default_timezone == :utc
      value = value.getutc if !value.utc?
    else
      value = value.getlocal
    end
  end

  result = value.to_fs(:db)
  if value.respond_to?(:usec) && value.usec > 0
    result << "." << sprintf("%06d", value.usec)
  else
    result
  end
end

def quoted_time(value) # :nodoc:
  value = value.change(year: 2000, month: 1, day: 1)
  quoted_date(value).sub(/\A\d\d\d\d-\d\d-\d\d /, "")
end
```

The four exports are those two bodies cut along the Temporal type instead: `toFsDbWithUsec` is
`to_fs(:db)` plus the `usec` arm, `formatPlainTimeForSql` is `quoted_time`'s `change` + `sub`, and
`defaultSqlTimezone` is the `default_timezone == :utc` test turned into a zone id. Consumers:
`packages/activerecord/src/connection-adapters/abstract/quoting.ts`, `packages/activerecord/src/connection-adapters/abstract/temporal-wire.ts`, `packages/activerecord/src/connection-adapters/postgresql/quoting.ts`.

## Acceptance criteria

- [ ] `quotedDate` / `quotedTime` in `packages/activerecord/src/connection-adapters/abstract/quoting.ts` hold the Rails bodies line for line: the `acts_like?(:time)` zone arm, `to_fs(:db)` through `@blazetrails/date` / activesupport's `toFs`, the `usec` arm, and `change(year: 2000, month: 1, day: 1)` + `sub`.
- [ ] `sql-datetime.ts` is deleted, or holds nothing exported; its file-level receipt is gone and no receipt replaces it.
- [ ] The PostgreSQL `quoted_date` override (`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/postgresql/quoting.rb:143-150`) calls `super` as Rails does rather than a formatter helper.
- [ ] `pnpm parity:api:extra:gate` green (activerecord rowless).

## Verification

```bash
pnpm parity:api:extra:gate && pnpm parity:api:calls && pnpm vitest run packages/activerecord/src/quoting.test.ts packages/activerecord/src/adapters/postgresql/quoting.test.ts packages/activerecord/src/connection-adapters/abstract/quoting-helpers.trails.test.ts
```
