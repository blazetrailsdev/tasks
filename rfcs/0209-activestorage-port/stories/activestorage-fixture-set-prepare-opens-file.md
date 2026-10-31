---
title: "activestorage-fixture-set-prepare-opens-file"
status: claimed
updated: 2026-10-31
rfc: "0209-activestorage-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-10-31T15:56:40Z"
assignee: "activestorage-fixture-set-prepare-opens-file"
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/activestorage/lib/active_storage/fixture_set.rb:71` is `file_fixture(instance.filename.to_s).open`; `FixtureSet#prepare` in `packages/activestorage/src/fixture-set.ts` reads `IO.binreadAsync` into a `StringIO` and carries `@missingRailsCall open — PERMANENT`, and `test_helper.rb:47,59-65` helpers do the same. That receipt is not a language shortcoming: it follows the async-fs rule. `FileFixtures#fileFixture` returns a string, not a Pathname (`ruby-compat-pathname-for-file-fixture-and-save-page`).

## Acceptance criteria

- `prepare` and the helpers open the fixture file as Rails does, once a Pathname `file_fixture` lands, or the receipt is replaced by a ruling.
