---
title: "class-paths-pairs-oid-point-beside-activerecord-point"
status: draft
updated: 2026-11-03
rfc: "0213-zeitwerk-build-time-autoloader"
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

`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/postgresql/oid/point.rb`
defines two classes with the short name `Point`: `ActiveRecord::Point` (a Struct,
`:4`) and `ActiveRecord::ConnectionAdapters::PostgreSQL::OID::Point` (`:8`).
`scripts/api-compare/class-paths.ts`'s pairing goes through compare.ts's
`resolveTsClassForRuby(short, expectedFile, …)` (compare.ts:3286), keyed on
`<file>::<short>`, so both Ruby classes resolve to the one exported
`connection-adapters/postgresql/oid/point.ts::Point`, and `constantResidue`
records the TS class as `excluded` ("no Ruby counterpart"). Since
lazy-adapter-files-carry-their-own-constant-tables, `point.ts` seats with a
plain `ConnectionAdapters.PostgreSQL.OID.Point = Point`, so `rbModName(Point)`
answers `Point` instead of the Ruby path. The class carries a
`@noRailsEquivalent CONVERGEABLE` receipt pointing here.

## Acceptance criteria

- The pairing tells the two same-short-name classes in one Ruby file apart (by
  nesting or superclass), so `OID::Point` pairs with point.ts's exported `Point`.
- `constants.postgresql-oid-point.generated.ts` names it
  `ActiveRecord::ConnectionAdapters::PostgreSQL::OID::Point`, `point.ts` imports
  it, and the receipt is removed.
