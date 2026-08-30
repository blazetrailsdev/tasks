---
title: "quoted_date and MySQL type_cast drop Rails' default_timezone branch"
status: draft
updated: 2026-08-30
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 140
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by the RFC 0077 close-out sweep (2026-08-30). RFC 0077 closed with its
five-point "Done when" verification last run on 2026-08-09; this is one of the
two point-3 rows re-verified as still divergent on main.

Rails reads `default_timezone` **inside the quoting body** and branches on it.
Two ported bodies drop that read entirely and push the decision into a trails-only
indirection, `defaultSqlTimezone()` in
`packages/activerecord/src/connection-adapters/abstract/sql-datetime.ts:49`.

**`quoted_date`** — `abstract/quoting.rb:184-198`:

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
  ...
```

`abstract/quoting.ts:242-265` has no `default_timezone` read and no
`acts_like?(:time)` guard — it is a flat instanceof chain over Temporal types
that hands each to a `format*ForSql` helper.

**MySQL `type_cast`** — `mysql/quoting.rb:94-115` is a four-arm case
(`ActiveSupport::TimeWithZone` / `Time` / `Date` / `super`) where the first two
arms each branch on `default_timezone`, and the `Time` arm additionally guards
`value.utc?` on both sides. `mysql/quoting.ts:152-164` has three arms
(`TimeValue|PlainTime` -> `quotedTime`; four Temporal types -> `quotedDate`;
else `super`), no `default_timezone` read, no `TimeWithZone` arm, and no
`utc?` guards.

## Acceptance criteria

- `quotedDate` reads the default timezone in its own body and carries Rails'
  two-arm branch, guarded by the `acts_like?(:time)` equivalent.
- MySQL `typeCast` carries Rails' four arms in Rails' order, including the
  `TimeWithZone` arm and the `utc?` guards inside the `Time` arm.
- Neither body reaches `defaultSqlTimezone()` for the branch decision; if that
  helper survives for formatting, it no longer carries the timezone _choice_.
- `pnpm parity:api:calls` shows the `default_timezone` omissions gone for both
  files, with no new baseline rows.
