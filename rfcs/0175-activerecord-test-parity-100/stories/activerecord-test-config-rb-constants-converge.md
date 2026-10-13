---
title: "activerecord: port the rest of test/config.rb and read TEST_ROOT / FIXTURES_ROOT from it in tests"
status: in-progress
updated: 2026-10-13
rfc: "0175-activerecord-test-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: trails#8873
claim: "2026-10-13T20:42:25Z"
assignee: "activerecord-test-config-rb-constants-converge"
blocked-by: null
closed-reason: null
---

## Context

From trails PR 8857. `packages/activerecord/src/config.ts` mirrors `vendor/rails/v8.0.2/activerecord/test/config.rb:3-8`
but ports only `TEST_ROOT` (module-private) and `FIXTURES_ROOT`. Rails defines, in order, `TEST_ROOT`, `ASSETS_ROOT`,
`FIXTURES_ROOT`, `MODELS_ROOT`, `MIGRATIONS_ROOT`, `SCHEMA_ROOT`, each `TEST_ROOT + "/<dir>"`.

Tests still declare their own copies instead of reading the constant:

- `packages/activerecord/src/marshal-serialization.test.ts:10` and `packages/activerecord/src/yaml-serialization.test.ts:12`:
  `const TEST_ROOT = new URL("./test-helpers/", import.meta.url)`, a `URL` where Rails' is a path String.
- `packages/activerecord/src/fixture-set/file.test.ts:7` and `packages/activerecord/src/fixtures.test.ts:255,1591`:
  a local `FIXTURES_ROOT` pointing at `fixture-set/test-data`, shadowing the Rails name with a different directory.

`packages/activerecord/src/associations/has-one-through-associations.test.ts` also sets
`Membership.inheritanceColumn = "type"` at describe scope, which `test-helpers/models/membership.ts:52` already does.

## Acceptance criteria

- [ ] `config.ts` exports `TEST_ROOT` as a path string and every other `config.rb` constant whose directory exists in
      trails, in Rails' order; a constant with no trails directory is left out, not stubbed.
- [ ] The two serialization tests read `TEST_ROOT` from `config.ts`; no test declares a local `TEST_ROOT`.
- [ ] A local named `FIXTURES_ROOT` either is the `config.ts` constant or is renamed so it does not shadow the Rails
      name with another directory.
- [ ] The redundant `Membership.inheritanceColumn` assignment in `has-one-through-associations.test.ts` is removed.
