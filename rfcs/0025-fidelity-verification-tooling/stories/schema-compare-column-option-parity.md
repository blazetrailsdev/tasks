---
title: "schema:compare — compare column options (null/limit/default/precision), not just type"
status: draft
updated: 2026-07-24
rfc: "0025-fidelity-verification-tooling"
cluster: null
deps: []
deps-rfc: []
est-loc: 200
priority: 20
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`pnpm schema:compare` (PR #4966) compares TEST_SCHEMA columns against
`vendor/rails/activerecord/test/schema/schema.rb` by **type only** —
`typesAgree()` in `scripts/schema-compare/compare.ts` maps the Rails type to a
`ColumnSpec` type and stops there. The parser already captures `null`, `limit`,
`precision`, `scale`, `default`, and `array` into `RailsColumnOptions`
(`scripts/schema-compare/parse-schema-rb.ts`), but nothing consumes them.

So a column declared `t.string :settings, null: true, limit: 1024` in schema.rb
matches a bare `settings: "string"` in TEST_SCHEMA. Those options are
load-bearing: `admin_accounts.name` carries a comment explaining that the
bare-string shorthand yields NOT NULL, which reflects an implicit `""` default
on MySQL/MariaDB and breaks `Admin::Account.new`'s nil `name`. That class of
divergence is currently invisible to the gate.

The type-level comparison is clean today (zero SHAPE findings across the 242
shared tables), which is exactly why option-level comparison is the next
useful increment.

## Acceptance criteria

- SHAPE findings compare `null`, `limit`, `precision`, `scale`, and `default`
  in addition to type, accounting for Rails defaults (an omitted `null:` means
  nullable) and for the adapter-driven cases the type check already tolerates.
- Rails-side option values are normalised before comparison — `default:` is
  currently captured as the raw Ruby source token (e.g. `"hard"`, `-> { ... }`).
- Findings stay report-only until the count reaches zero, then the verdict
  flips to fatal alongside the existing INVENTED verdicts.
- Tests cover at least one divergence per option, driven through
  `compareSchemas` with synthetic tables.
