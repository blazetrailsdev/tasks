---
title: "test-fixture-accessor-types-derived-from-fixture-files"
status: draft
updated: 2026-10-01
rfc: "0174-activerecord-api-parity-100"
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

trails#8310 ported `TestFixtures#method_missing` / `respond_to_missing?` (`vendor/rails/v8.0.2/activerecord/lib/active_record/test_fixtures.rb:270-284`), so a test reads `this.posts("one")` at run time (`packages/activerecord/src/test-fixtures.ts`, the Proxy spliced in the `included` hook).

The accessor has no derived type. The scaffold's functional test (`packages/trailties/src/generators/test-unit/scaffold/templates.ts`) emits a per-class `declare posts: FixtureSetAccessor<Post>;`, and any other fixture set a test reads needs the same hand-written line. Rails needs nothing: every set under `test/fixtures/` is answered (`fixtures :all`, `test_fixtures.rb:56-70`).

Models already have a static path: `trails-tsc --schema` virtualizes model files from `db/schema.ts` (`packages/activerecord-cli/src/tsc-wrapper/ar-models-plugin.ts`). Fixture sets have none. The generated `tsconfig.json` also does not include `test/` (`packages/trailties/src/generators/app-generator.ts`), which `named-route-helpers-untyped-on-controllers-and-tests` owns, so nothing type-checks a generated test today.

## Acceptance criteria

- [ ] Under `trails-tsc`, every fixture set in `test/fixtures/` (`posts.yml`, `admin/posts.yml` as `admin_posts`) is a typed accessor on `ActiveSupport::TestCase` descendants, typed by the set's model through the same table-name to model mapping `FixtureSet` uses at run time (`fixtures.rb:595`, `default_fixture_model_name`), with `set_fixture_class` overrides honoured.
- [ ] The scaffold template's `declare <fixtureName>: FixtureSetAccessor<Model>` line and its import are removed.
- [ ] A label that the set's file does not define is a type error where the file is statically readable.
