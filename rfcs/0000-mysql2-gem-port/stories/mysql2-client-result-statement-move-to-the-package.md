---
title: "Move Mysql2::Client, Result and Statement into @blazetrails/mysql2; bind casting moves to the adapter"
status: draft
updated: 2026-11-20
rfc: "0000-mysql2-gem-port"
cluster: package
packages: ["mysql2", "activerecord"]
deps: ["mysql2-package-and-vendor-source"]
deps-rfc: []
est-loc: 400
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/activerecord/lib/mysql2/client.ts` cannot leave activerecord as it stands because of three
imports (`client.ts:13-15`): `TimeWithZone` from activesupport, `quotedDate` from
`../connection-adapters/abstract/quoting.js` and `defaultTimezone` from `../active-record.js`. All
three feed `bind` (`client.ts:404-414`), which `mysql2Client()` installs by wrapping the npm
connection's `execute` (`:452-457`).

That casting is not the gem's. Rails type-casts binds in the adapter,
`type_casted_binds = type_casted_binds(binds)`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/mysql2/database_statements.rb:64-66`,
through `abstract/quoting.rb`), and the gem binds a Ruby `Time` / `Date` natively in C
(`vendor/mysql2/0.5.6/ext/mysql2/statement.c`, `rb_mysql_stmt_execute`). So the `TimeWithZone` arm
and the `quotedDate` call belong in trails' `mysql2/database-statements.ts` `performQuery`
(`packages/activerecord/lib/connection-adapters/mysql2/database-statements.ts`); the gem keeps only
what `statement.c` does with a `Time` / `Date` / `Number` wrapper.

Importers today: `mysql2-adapter.ts:34`, `mysql2/database-statements.ts:12`, and 14 test files under
`packages/activerecord/test/cases/` (`grep -rn "lib/mysql2/client" packages/activerecord/test`), two
of which (`test/cases/mysql2/client.trails.test.ts`, `client-cast.trails.test.ts`) test the gem
surface and move with it.

## Acceptance criteria

- [ ] `client.ts`, `result.ts`, `statement.ts` move to `packages/mysql2/lib/` by `git mv`; `packages/activerecord/lib/mysql2/` is deleted.
- [ ] The package imports nothing from activerecord or activesupport (`grep -rn "@blazetrails/active" packages/mysql2/lib` is empty); `@blazetrails/date` is added as a workspace dependency.
- [ ] The `TimeWithZone` / `quotedDate` / `defaultTimezone()` casting leaves `bind` and is done where Rails does it, in the adapter's bind type-casting; the gem's bind keeps only the arms `statement.c` has. A test that sent a `TimeWithZone` bind through `prepare`/`execute` still passes on the MariaDB lane.
- [ ] `test/cases/mysql2/client.trails.test.ts` and `client-cast.trails.test.ts` move to `packages/mysql2/test/`; the other activerecord tests import from `@blazetrails/mysql2`. `packages/activerecord/package.json` gains `@blazetrails/mysql2` as an optional peer and dev dependency; dx-tests and virtualized-dx-tests `paths` are updated (RFC 0186 § "Registration cost" item 7).
- [ ] `pnpm parity:api --package mysql2` scores `client.rb` / `result.rb` / `statement.rb` from the package with no regression from 12/33; the PR body prints the row.

## Verification

```bash
pnpm vitest run packages/mysql2 && pnpm vitest run packages/activerecord/test/cases/adapters/mysql2 && pnpm parity:api --package mysql2
```
