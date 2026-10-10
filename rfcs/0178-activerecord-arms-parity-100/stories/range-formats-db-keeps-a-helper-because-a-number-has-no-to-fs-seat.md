---
title: "activesupport: RANGE_FORMATS[:db] keeps a toFsDb helper because a JS number has no to_fs seat"
status: draft
updated: 2026-10-10
rfc: "0178-activerecord-arms-parity-100"
cluster: null
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

Left by the PR that gave `to_fs` one receiver dispatch (trails#8742, story
`to-fs-has-no-receiver-dispatch-across-date-time-and-time-with-zone`): `Time#to_fs` is Rails' body
on `RubyTime.prototype.toFs`, `Date#to_fs` and `DateTime#to_fs` are seated on ruby-compat's
`TEMPORAL_METHOD_TABLE`, and callers send `rbFSend(value, "toFs", format)`.

`RANGE_FORMATS[:db]`
(`vendor/rails/v8.0.2/activesupport/lib/active_support/core_ext/range/conversions.rb:9-28`) calls
`start.to_fs(:db)` / `stop.to_fs(:db)` on the receiver, which for an Integer range is
`ActiveSupport::NumericWithFormat#to_fs`
(`activesupport/lib/active_support/core_ext/numeric/conversions.rb:113-140`).

`packages/activesupport/src/core-ext/range/conversions.ts` keeps a private `toFsDb` helper that
answers `String(value)` for a JS number or bigint and sends `toFs` to every other receiver,
because `rbFSend(1, "toFs", "db")` raises `NoMethodError`: ruby-compat has no method seat for a
JS number, and `NumericWithFormat.toFs` (`core-ext/numeric/conversions.ts`) is a free function.

## Acceptance criteria

- [ ] `rbFSend(1, "toFs", "db")` reaches `NumericWithFormat.toFs`.
- [ ] `core-ext/range/conversions.ts` has no `toFsDb`; `RANGE_FORMATS.db` sends `toFs` to the
      receiver in each arm, as `range/conversions.rb:9-28`.
- [ ] `range-ext.test.ts` passes.
