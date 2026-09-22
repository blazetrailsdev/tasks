---
title: "Converge FixtureSet#read_fixture_files off the TS-rows path branch"
status: claimed
updated: 2026-09-22
rfc: "0105-ar-deps-test-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 300
priority: 35
pr: null
claim: "2026-09-21T21:24:45Z"
assignee: "fixture-set-read-fixture-files-accepts-ts-rows"
blocked-by: null
closed-reason: null
---

## Context

Rails' `FixtureSet#read_fixture_files(path)` (`vendor/rails/activerecord/lib/active_record/fixtures.rb:781-797`) only
reads `.yml` files under `path`. trails#7765 added a second branch to `readFixtureFiles` in
`packages/activerecord/src/fixtures.ts`: when `path` is an object (a TS fixture module's rows from
`test-helpers/fixtures/*.ts`) rather than a string, it reads `_fixture.model_class` / `_fixture.ignore` from the object
and wraps each row in a `Fixture`. `FixtureSet.createFixtures`' `fixturesDirectories` is therefore a map of set name
to rows rather than Rails' list of directories (`:595`), and the `fixtures()` loader in `test-fixtures.ts` feeds it
from `fixtureRegistry`.

## Converged shape

`createFixtures(fixturesDirectories, fixtureSetNames, classNames, config)` takes fixture directories as in Rails, and
every canonical set is read through the `.yml` branch (`FixtureSet::File`, already ported), with the TS registry
reduced to model resolution only. Alternatively, `path` becomes a directory the TS fixture modules are loaded from,
with the same `_fixture` handling as `FixtureSet::File`.

## Acceptance criteria

- `readFixtureFiles` has a single `path: string` signature, matching `fixtures.rb:781`.
- The `fixtures()` loader passes directories, not rows, to `FixtureSet.createFixtures`.
