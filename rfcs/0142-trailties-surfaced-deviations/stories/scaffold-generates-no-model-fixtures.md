---
title: "scaffold-generates-no-model-fixtures"
status: draft
updated: 2026-09-30
rfc: "0142-trailties-surfaced-deviations"
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

Rails' scaffold runs the test_unit model generator, which writes
`test/fixtures/posts.yml` from `fixtures.yml.tt`
(`vendor/rails/v8.0.2/railties/lib/rails/generators/test_unit/model/model_generator.rb:21-25`,
`templates/fixtures.yml.tt`). It prints as `create test/fixtures/posts.yml`
in Rails' scaffold output.

trails' scaffold emits `test/models/post.test.ts` but no fixture file.
The controller test that #8253 ported from `functional_test.rb.tt`
(`packages/trailties/src/generators/test-unit/scaffold/templates.ts:22`) sets up
`this.fixture("posts", "one")`. So on a fresh app all seven generated
controller tests fail with `StandardError: No fixture set named ':posts'`,
and `pnpm test` is red right after `generate scaffold`.

Found re-running the root README quickstart (PR #8195) on `main` at `329f709afd`.

## Acceptance criteria

- [ ] The model generator (and so `scaffold`) writes `test/fixtures/<table>.yml`
      from a port of `fixtures.yml.tt`, gated on `fixture` / `fixture_replacement`
      as `model_generator.rb:21-25` is.
- [ ] `trails new` + `generate scaffold` + `pnpm test` passes all generated tests.
