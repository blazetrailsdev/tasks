---
title: "Port FixturesTest empty yaml fixture cases"
status: claimed
updated: 2026-09-15
rfc: "0105-ar-deps-test-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: 10
pr: null
claim: "2026-09-15T23:26:23Z"
assignee: "binaries-fixture-data-from-flowers-asset"
blocked-by: null
closed-reason: null
---

## Context

`fixtures_test.rb:522-528` (`test_empty_yaml_fixture`, `test_empty_yaml_fixture_with_a_comment_in_it`) assert
`ActiveRecord::FixtureSet.new(nil, "accounts", Account, FIXTURES_ROOT + "/naked/yml/accounts")` (and `companies`)
is non-nil. They are excluded in `scripts/parity/unported-files/unscoped.ts` (row "empty yaml fixture").

That row's reason predates trails#7763, which ported `FixtureSet#initialize` / `read_fixture_files` with a real
`.yml` path (`fixtures.rb:713-807`, `packages/activerecord/src/fixtures.ts`) and copies `parrots.yml` into
`packages/activerecord/src/fixture-set/test-data`. The instance form is no longer the blocker. Only the two naked
fixture files are missing.

## Acceptance criteria

- Copy `vendor/rails/activerecord/test/fixtures/naked/yml/accounts.yml` and `companies.yml` into
  `packages/activerecord/src/fixture-set/test-data/naked/yml/`.
- Port both cases verbatim under `describe("FixturesTest")` in `packages/activerecord/src/fixtures.test.ts` and
  delete the exclusion row.
