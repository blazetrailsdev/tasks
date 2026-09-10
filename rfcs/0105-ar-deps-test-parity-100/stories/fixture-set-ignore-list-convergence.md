---
title: "fixture-set-ignore-list-convergence"
status: ready
updated: 2026-09-10
rfc: "0105-ar-deps-test-parity-100"
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

Rails' fixture loader honours a `_fixture: ignore:` list: the named labels stay
in the YAML (so other rows can `<<:` merge their anchors) but are not inserted
and have no accessor. `ActiveRecord::FixtureSet#read_fixture_files`
(`vendor/rails/activerecord/lib/active_record/fixtures.rb`) collects
`config_row["ignore"]` into `@ignored_fixtures` (alongside the `"DEFAULTS"`
label, `fixtures.rb:773`) and drops those rows.
`vendor/rails/activerecord/test/fixtures/other_books.yml` (PUBLISHED,
PUBLISHED_PAPERBACK, PUBLISHED_EBOOK) and `parrots.yml` (DEAD_PARROT) use it.

trails' loader only filters the literal `DEFAULTS` key
(`packages/activerecord/src/fixtures.ts:520`) and has no `ignore` arm. The TS
corpus (`test-helpers/fixtures/other-books.ts`, `parrots.ts`) instead omits the
ignored rows, so `IgnoreFixturesTest` (`fixtures_test.rb:1526-1555`, ported in
`packages/activerecord/src/fixtures.test.ts`) passes because the labels were
never defined, not because the loader skipped them.

## Acceptance criteria

- [ ] The fixture loader accepts an ignore list per set (the `_fixture: ignore:`
      counterpart) and drops those labels from insertion and from the accessor,
      as `fixtures.rb` does.
- [ ] `other-books.ts` and `parrots.ts` carry the ignored rows and declare them
      ignored, mirroring `other_books.yml` / `parrots.yml`.
- [ ] `IgnoreFixturesTest` passes unchanged against the converged corpus.
