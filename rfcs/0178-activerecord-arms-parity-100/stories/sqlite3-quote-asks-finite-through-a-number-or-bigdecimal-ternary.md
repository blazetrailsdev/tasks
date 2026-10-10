---
title: "activerecord: sqlite3 quote asks finite? through a number-or-BigDecimal ternary"
status: done
updated: 2026-10-10
rfc: "0178-activerecord-arms-parity-100"
cluster: null
packages: ["activerecord", "ruby-compat"]
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: trails#8759
claim: "2026-10-10T16:39:42Z"
assignee: "base-load-schema-primary-key-warm-arm-moves-to-primary-key-resolution"
blocked-by: null
closed-reason: null
---

## Context

`SQLite3::Quoting#quote` (`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/sqlite3/quoting.rb:53-64`)
is `case value when Numeric` then `if value.finite?`. The port
(`packages/activerecord/src/connection-adapters/sqlite3/quoting.ts`) asks `finite?` through a ternary,
`value instanceof BigDecimal ? value.isFinite() : Number.isFinite(value)`, which is one `if` more than
Rails. It carries `@inventedArm if — CONVERGEABLE` against this story.

## Acceptance criteria

- [ ] ruby-compat answers `Numeric#finite?` for a JS number and a `BigDecimal` in one call, cited to
      MRI, and `quote` calls it with no ternary.
- [ ] The `@inventedArm if` receipt on `quote` is deleted; `adapters/sqlite3/quoting.test.ts` green.
