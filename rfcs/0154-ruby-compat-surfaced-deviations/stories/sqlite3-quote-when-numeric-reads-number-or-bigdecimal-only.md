---
title: "activerecord: sqlite3 quote's when Numeric admits only a number or a BigDecimal"
status: draft
updated: 2026-10-10
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Left by trails#8759. `SQLite3::Quoting#quote`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/sqlite3/quoting.rb:53-64`)
is `case value when Numeric` then `if value.finite?`. The port
(`packages/activerecord/src/connection-adapters/sqlite3/quoting.ts`, `quote`) spells `when Numeric`
as `typeof value === "number" || value instanceof BigDecimal`, so a `bigint` or a ruby-compat
`Rational` takes the `else` arm and never reaches `isFinite`. ruby-compat's `isFinite`
(`packages/ruby-compat/src/numeric.ts`) already answers for a `bigint`; that arm has no caller.

ruby-compat has no `Numeric === x` predicate. `rbFloatTypeP` and `rbIntegerTypeP` exist in
`numeric.ts`; `Rational`, `Complex` and `BigDecimal` are separate classes.

## Acceptance criteria

- [ ] ruby-compat answers `Numeric === x` in one call, cited to MRI, covering number, bigint,
      `Rational`, `Complex` and `BigDecimal`.
- [ ] `quote` tests `when Numeric` through it, and `isFinite` answers `Rational#finite?`
      (`Numeric#finite?`, `vendor/ruby/v3.3.11/numeric.rb:38`).
- [ ] `adapters/sqlite3/quoting.test.ts` green.
