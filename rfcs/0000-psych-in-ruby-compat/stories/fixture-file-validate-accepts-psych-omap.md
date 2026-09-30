---
title: "FixtureSet::File#validate: accept YAML::Omap as Rails does"
status: draft
updated: 2026-09-29
rfc: "0000-psych-in-ruby-compat"
cluster: fidelity
packages: ["activerecord"]
deps: ["psych-omap"]
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

`vendor/rails/v8.0.2/activerecord/lib/active_record/fixture_set/file.rb:76-79`:
`unless Hash === data || YAML::Omap === data`. trails
(`packages/activerecord/src/fixture-set/file.ts:104-106`) accepts a plain object
or a `Map`. The `Map` arm stands in for `Omap`, because nothing produced one
before. `fixtures_test.rb`'s omap fixture (`vendor/rails/v8.0.2/activerecord/test/fixtures/categories_ordered.yml`)
is exercised by `test_omap_fixtures` (`vendor/rails/v8.0.2/activerecord/test/cases/fixtures_test.rb:571`).

## Acceptance criteria

- [ ] `validate` tests `isPlainObject(data) || data instanceof YAML.Omap`, and
      the `Map` stand-in is removed.
- [ ] `omap fixtures` in `fixtures.test.ts` stays green, and the ordering
      assertion now comes from `Omap` order.

## Verification

`pnpm vitest run packages/activerecord/src/fixtures.test.ts packages/activerecord/src/fixture-set/`.
