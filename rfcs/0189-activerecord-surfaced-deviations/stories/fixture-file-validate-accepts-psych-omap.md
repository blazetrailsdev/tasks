---
title: "FixtureSet::File#validate: accept YAML::Omap as Rails does"
status: ready
updated: 2026-10-18
rfc: "0189-activerecord-surfaced-deviations"
cluster: fidelity
packages:
  - "activerecord"
deps: ["psych-omap", "configuration-file-parse-through-psych-unsafe-load"]
deps-rfc: []
est-loc: 40
priority: 55
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/activerecord/lib/active_record/fixture_set/file.rb:76-79`:
`unless Hash === data || YAML::Omap === data`. trails
(`packages/activerecord/src/fixture-set/file.ts:107`) accepts a plain object
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

## Audit 2026-10-22

ruby-compat ports `Psych::Omap` since trails#8918, so the stand-in has a real target.
