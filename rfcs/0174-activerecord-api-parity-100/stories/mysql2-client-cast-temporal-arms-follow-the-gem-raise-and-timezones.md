---
title: "activerecord: mysql2 cast's temporal arms raise the gem's Invalid date error and read the gem's db/app timezones"
status: ready
updated: 2026-10-10
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

trails#8702 deleted `connection-adapters/abstract/temporal-wire.ts` and rewrote the temporal arms of `cast` in
`packages/activerecord/src/connection-adapters/mysql2/mysql2-client.ts` after the mysql2 gem's text-row cast
(`mysql2-0.5.7/ext/mysql2/result.c`, `rb_mysql_result_fetch_row`, the `MYSQL_TYPE_TIMESTAMP` / `MYSQL_TYPE_DATETIME` and
`MYSQL_TYPE_DATE` / `MYSQL_TYPE_NEWDATE` arms). mysql2 is not a vendored source, so cite the installed gem. Three arms of
that cast are still not what the gem does:

- **The invalid-date raise is missing.** For a non-zero value with `month < 1 || day < 1` the gem raises
  `rb_raise(cMysql2Error, "Invalid date in field '%.*s': %s", fields[i].name_length, fields[i].name, row[i])` in both the
  datetime and the date arm. trails has no `Mysql2::Error` class, so `cast` falls through to `Time.utc` / `Time.local` /
  `new Date(...)`, which raise their own range errors with a different class and message.
- **`TIMESTAMP` ignores `databaseTimezone`.** The gem builds both `TIMESTAMP` and `DATETIME` with
  `rb_funcall(rb_cTime, args->db_timezone, 7, ...)`. trails reads `TIMESTAMP` / `TIMESTAMP2` as UTC whatever
  `queryOptions.databaseTimezone` says (`field.type.startsWith("TIMESTAMP") || queryOptions.databaseTimezone === "utc"`),
  a carry-over from the deleted `parseMysqlInstant` ("pinned session tz"). Find what pins the session time zone and
  whether Rails' `configure_connection` (`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/abstract_mysql_adapter.rb`)
  does the same; converge onto the gem's single `db_timezone` read.
- **The app-timezone step reads `defaultTimezone()`.** The gem converts only when `args->app_timezone` is set
  (`localtime` / `utc`), and Rails never sets `application_timezone`
  (`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/mysql2_adapter.rb`, `database_timezone: default_timezone`
  only), so the gem's value stays in the DB zone. trails always ends with
  `defaultTimezone() === "utc" ? val.getutc() : val.getlocal()`, which also makes `mysql2-client.ts` import
  `../../active-record.js`.

The gem's `DateTime` arm for `seconds < MYSQL2_MIN_TIME || seconds > MYSQL2_MAX_TIME` is not ported either; trails'
`Time` has no such range limit, so decide there whether it is a permanent omission.

Related, not a duplicate: `mysql2-driver-type-cast-is-named-temporal-and-covers-part-of-the-gem-cast` (naming, and the
`TIME` / integer / float arms). Its context still names `mysql/temporal-type-cast.ts`, which no longer exists; the
function is `cast` in `mysql2/mysql2-client.ts`.

## Acceptance criteria

- [ ] A non-zero `DATE` / `DATETIME` / `TIMESTAMP` with month or day 0 raises the gem's error class with the message `Invalid date in field '<name>': <raw>`; the error class is ported at its gem name, not a bare `Error`.
- [ ] `TIMESTAMP` and `DATETIME` are built in the same `databaseTimezone`, or the reason the session is pinned to UTC is cited from Rails at the arm.
- [ ] The trailing `defaultTimezone()` conversion is gone or replaced by an `applicationTimezone` query option read as the gem reads `app_timezone`; `mysql2-client.ts` no longer imports `active-record.js` if nothing else needs it.
- [ ] MariaDB lane green, including the prepared-statements variant.
