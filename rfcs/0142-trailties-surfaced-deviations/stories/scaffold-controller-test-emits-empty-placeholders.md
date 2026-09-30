---
title: "scaffold-controller-test-emits-empty-placeholders"
status: done
updated: 2026-09-29
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 1
pr: trails#8253
claim: "2026-09-29T19:19:01Z"
assignee: "scaffold-controller-test-emits-empty-placeholders"
blocked-by: null
closed-reason: null
---

## Context

Rails' scaffold functional test template
(`vendor/rails/v8.0.2/railties/lib/rails/generators/test_unit/scaffold/templates/functional_test.rb.tt:1-52`)
emits an `ActionDispatch::IntegrationTest` with real requests for all seven
actions, such as `get posts_url` / `assert_response :success`, and
`assert_difference("Post.count") { post posts_url, params: {...} }`
and `assert_difference("Post.count", -1) { delete post_url(@post) }`.

trails' scaffold controller generator
(`packages/trailties/src/generators/rails/scaffold-controller/scaffold-controller-generator.ts:116-120`)
emits one `references controller` test and seven empty `it("index", () => {})` bodies.
They pass in ~7 ms while every scaffold form page 500s, so the generated suite
proves nothing about the scaffold.

Found re-running the root README quickstart (PR #8195) on `main` at `c19bfc0aee`.
It depends on an integration-test harness usable from a generated app (RFC 0160).

## Acceptance criteria

- [ ] The emitted controller test ports `functional_test.rb.tt` test for test,
      same names, against the app's routes and fixtures.
- [ ] The api variant ports `api_functional_test.rb.tt`.
