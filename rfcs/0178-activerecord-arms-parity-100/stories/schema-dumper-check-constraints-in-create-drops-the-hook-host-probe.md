---
title: "activerecord: SchemaDumper#check_constraints_in_create gates on supports_check_constraints? at the caller"
status: draft
updated: 2026-10-05
rfc: "0178-activerecord-arms-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`SchemaDumper#checkConstraintsInCreate`
(`packages/activerecord/src/schema-dumper.ts`) opens with a duck-typed probe:
`const host = this._hookHost("checkConstraints")`, `if (!host) return`, then
`if (host.supportsCheckConstraints && !(await host.supportsCheckConstraints())) return`,
and reads `(await host.checkConstraints(table)) ?? []`.

Rails has none of that in the method. The gate is at the caller,
`remaining = check_constraints_in_create(table, tbl) if @connection.supports_check_constraints?`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/schema_dumper.rb:210`), and
the body starts `if (check_constraints = @connection.check_constraints(table)).any?`
(`schema_dumper.rb:283-303`).

trails PR 8536 converged the foreign-key twin: `tables` gates on
`this._adapter().supportsForeignKeys()` (`schema_dumper.rb:145`) and
`foreignKeys` calls `this._adapter().foreignKeys(table)` unconditionally.
`_hookHost` now exists only for this method. The earlier story
`converge-schema-dumper-fk-check-hook-duck-type` was closed as merged into
another story without this half being done.

The trails-only dumper tests pass stub sources; the ones that reach `table`
will need `supportsCheckConstraints` on the stub, as the foreign-key change
needed `supportsForeignKeys`
(`schema-dumper.trails.test.ts`, `connection-adapters/abstract/schema-dumper.trails.test.ts`).

## Acceptance criteria

- [ ] `table` gates the call on `this._adapter().supportsCheckConstraints()`, as `schema_dumper.rb:210`.
- [ ] `checkConstraintsInCreate` reads `this._adapter().checkConstraints(table)` with no host probe and no `?? []`.
- [ ] `_hookHost` is deleted.
- [ ] `pnpm parity:api:arms:report --package=activerecord --direction=invented` no longer lists the host-guard arms on `checkConstraintsInCreate`.
