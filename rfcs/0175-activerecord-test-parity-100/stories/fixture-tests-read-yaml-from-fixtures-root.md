---
title: "activerecord: fixture-set and fixtures tests read their .yml files from FIXTURES_ROOT, not fixture-set/test-data"
status: closed
updated: 2026-10-14
rfc: "0175-activerecord-test-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Do not want"
---

## Context

From trails PR 8873. `vendor/rails/v8.0.2/activerecord/test/cases/fixture_set/file_test.rb`
opens `::File.join(FIXTURES_ROOT, "accounts.yml")`, and
`vendor/rails/v8.0.2/activerecord/test/cases/fixtures_test.rb` builds
`FIXTURES_ROOT + "/naked/yml/accounts"` and `"#{FIXTURES_ROOT}/parrots"`, all against the one
`FIXTURES_ROOT` of `activerecord/test/config.rb:5`.

trails reads those paths from a second directory, `packages/activerecord/src/fixture-set/test-data`,
through a local `YAML_FIXTURES_ROOT` in `packages/activerecord/src/fixture-set/file.test.ts` and
twice in `packages/activerecord/src/fixtures.test.ts` (`FixturesTest`, `HasManyThroughFixture`).
`packages/activerecord/src/config.ts`'s `FIXTURES_ROOT` (`test-helpers/fixtures`) holds the same
sets as `.ts` modules only. PR 8873 renamed the local so it no longer shadows the Rails name; the
second directory is still there.

## Acceptance criteria

- [ ] Those tests read `FIXTURES_ROOT` from `config.ts`, with the `.yml` files they open living
      under it, and no `YAML_FIXTURES_ROOT` remains.
- [ ] `fixture-set/test-data` is deleted, or what must stay is named with the reason.
- [ ] Test names unchanged; `pnpm parity:test:assertions` stays green.
