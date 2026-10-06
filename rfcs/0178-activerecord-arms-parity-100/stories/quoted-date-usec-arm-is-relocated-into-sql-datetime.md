---
title: "activerecord: Quoting#quoted_date owns its usec arm instead of relocating it into sql-datetime.ts"
status: draft
updated: 2026-10-01
rfc: "0178-activerecord-arms-parity-100"
cluster: arms
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Quoting#quoted_date`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/abstract/quoting.rb:184-199`)
formats the value with `to_fs(:db)` and then appends the microseconds itself:

```ruby
result = value.to_fs(:db)
if value.respond_to?(:usec) && value.usec > 0
  result << "." << sprintf("%06d", value.usec)
else
  result
end
```

trails' `quotedDate` (`packages/activerecord/src/connection-adapters/abstract/quoting.ts:195-205`)
ends at `return toFsDb(value)`. The `usec` arm is not dropped, it is relocated: `toFsDb`
(`quoting.ts:288-304`) calls `formatPlainDateTimeForSql`, which calls `toFsDbWithUsec` and
`microsecondFraction` in `connection-adapters/abstract/sql-datetime.ts:45-48,77-79`, a file
carrying a file-level `@noRailsEquivalent PERMANENT`. So `to_fs(:db)` and the fraction are
one call in the port, and `pnpm parity:api:arms:report --package=activerecord
--direction=missing` reports `quotedDate` as `-if`.

`formatPlainDateTimeForSql` is also read by `formatPlainTimeForSql`
(`sql-datetime.ts:62-75`) and pinned by `precision-roundtrip.trails.test.ts:48-62`, which
assert the fraction is included, so the seconds-only formatter and the fraction have to be
separated there before `quotedDate` can own the arm.

## Acceptance criteria

- [ ] `quotedDate` formats with a seconds-only `to_fs(:db)` and appends the `%06d`
      microseconds under Rails' `respond_to?(:usec) && usec > 0` guard, in the method body.
- [ ] No formatter outside `quotedDate` appends the fraction for a value `quotedDate` handles.
- [ ] The arms report has no `quotedDate` row; `quotedTime` and the precision round-trip
      tests stay green on all three adapters.
