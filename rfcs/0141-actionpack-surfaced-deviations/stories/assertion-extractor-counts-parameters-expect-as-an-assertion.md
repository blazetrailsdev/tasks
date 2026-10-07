---
title: "Assertion extractor counts Parameters#expect as an assertion"
status: draft
updated: 2026-10-07
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`scripts/test-compare/extract-ruby-tests.rb:122` counts any call named `expect`
as an assertion (`name == "expect" || name == "expects" || ...`), whatever its
receiver. That is right for a receiver-less RSpec / minitest-spec `expect(x)`,
and wrong for `ActionController::Parameters#expect`
(`vendor/rails/v8.0.2/actionpack/lib/action_controller/metal/strong_parameters.rb`),
an ordinary method the test calls on `params`.

So a test that is Rails' body statement for statement still reports an
assertion-count mismatch. After trails#8617 two such rows remain in
`controller/parameters/nested_parameters_permit_test.rb`:

- "nested params with numeric keys addressing individual numeric keys using
  require first" (`nested_parameters_permit_test.rb:216-232`): Rails 2, trails 1.
- "nested number as key" (`:265-277`): Rails 4, trails 3.

`parameters_expect_test.rb` calls `params.expect(...)` in nearly every test, so
most of its 22 assertion-count rows are the same artifact, and the port of that
file (`parameters-expect-test-carries-rails-names-over-invented-bodies`) cannot
reach zero until this is fixed. The TS extractor does not count
`params.expect(...)`.

## Acceptance criteria

- [ ] `extract-ruby-tests.rb` counts `expect` as an assertion only when the
      call has no receiver; `params.expect(...)` / `@params.expect(...)` count
      nothing, on both the Ruby and the TS side.
- [ ] A `scripts/test-compare` unit test pins both arms.
- [ ] The two `nested_parameters_permit_test.rb` rows above clear, and the
      `actioncontroller` assertion mark is lowered by hand to the new counts.
