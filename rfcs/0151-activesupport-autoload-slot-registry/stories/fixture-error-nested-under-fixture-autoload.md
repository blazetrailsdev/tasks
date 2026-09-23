---
title: "Autoload Fixture and raise Fixture::FixtureError, not ActiveRecord.FixtureError"
status: draft
updated: 2026-09-23
rfc: "0151-activesupport-autoload-slot-registry"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#7992 autoloads `FixtureError` directly on the `ActiveRecord` namespace
(`packages/activerecord/src/namespaces.ts`, `ActiveRecord.autoload("FixtureError", "active_record/fixtures")`).
`build_fixture_sql`'s raise in `connection-adapters/abstract/database-statements.ts` reads `ActiveRecord.FixtureError`.

Rails nests the class, `class Fixture; class FixtureError < StandardError` (`activerecord/lib/active_record/fixtures.rb:806-812`),
and raises `Fixture::FixtureError` (`connection_adapters/abstract/database_statements.rb:615`). `Fixture` is loaded
through `autoload :FixtureSet, "active_record/fixtures"` (`active_record.rb:54`). trails declares `FixtureError` /
`FormatError` as top-level exports of `fixtures.ts`, not as members of `Fixture`.

## Acceptance criteria

- `FixtureError` / `FormatError` are reachable as `Fixture.FixtureError` / `Fixture.FormatError`, mirroring `fixtures.rb:806-815`.
- The autoload registers `Fixture` (path `"active_record/fixtures"`), and the raise reads `new ActiveRecord.Fixture.FixtureError(...)`.
- `parity:api:extra:gate` `total` does not rise.
