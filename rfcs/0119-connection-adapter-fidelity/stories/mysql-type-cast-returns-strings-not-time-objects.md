---
title: "mysql-type-cast-returns-strings-not-time-objects"
status: draft
updated: 2026-09-06
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`MySQL::Quoting#type_cast`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/mysql/quoting.rb:94-115`)
exists precisely so the adapter hands mysql2 a `Time` or `Date` OBJECT rather
than a String — the comment at `mysql/quoting.rb:91-93` says so: "Override
+type_cast+ we pass to mysql2 Date and Time objects instead of Strings since
MySQL adapters are able to handle those classes more efficiently."

`packages/activerecord/src/connection-adapters/mysql/quoting.ts` `typeCast`
carries Rails' four arms and the `default_timezone` / `utc?` branches after
PR #7543, but every arm ends in `this.quotedDate(...)`, so the value that
reaches the driver is a formatted SQL string. The divergence is in the trails
driver seam — `typeCastedBinds` (`abstract/quoting.ts`) feeds
`packages/activerecord/src/connection-adapters/mysql2/*`, which binds strings —
not in the branches themselves. It predates #7543 and is recorded there as
`@noRailsEquivalent CONVERGEABLE mysql-type-cast-returns-strings-not-time-objects`
on the function.

Converging it means teaching the mysql2 driver path to bind a Temporal /
`TimeWithZone` value natively, then letting each arm answer the converted value
the way `mysql/quoting.rb:96-112` does, with only the `else` arm reaching
`super`.

## Acceptance criteria

- [ ] The mysql2 bind path accepts a Temporal / `TimeWithZone` value and binds
      it without a `quoted_date` round trip through a String.
- [ ] `typeCast`'s `TimeWithZone`, `Time` and `Date` arms answer the converted
      value itself (`mysql/quoting.rb:96-112`), not `this.quotedDate(...)`.
- [ ] The `@noRailsEquivalent CONVERGEABLE
    mysql-type-cast-returns-strings-not-time-objects` receipt is deleted from
      `mysql/quoting.ts`.
- [ ] The MariaDB lane stays green, including the prepared-statements-only job.
