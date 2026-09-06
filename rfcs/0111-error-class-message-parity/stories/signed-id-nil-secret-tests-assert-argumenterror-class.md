---
title: "assert the ArgumentError class in the signed-id nil-secret tests"
status: ready
updated: 2026-09-06
rfc: "0111-error-class-message-parity"
cluster: exclude-burndown
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: 40
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced in #6476 while converging `signedIdVerifier`'s construction kwargs.

Rails asserts the error CLASS for the two nil-secret cases
(`vendor/rails/activerecord/test/cases/signed_id_test.rb:159-176`):

```ruby
test "fail to work without a signed_id_verifier_secret" do
  ActiveRecord::Base.signed_id_verifier_secret = nil
  Account.instance_variable_set :@signed_id_verifier, nil

  assert_raises(ArgumentError) do
    @account.signed_id
  end
end
```

Our ports of both tests
(`packages/activerecord/src/signed-id.test.ts` — "fail to work without a
signed_id_verifier_secret" and "fail to work without when
signed_id_verifier_secret lambda is nil") assert only bare
`expect(...).toThrow()`, so any error at all credits. #6476 made
`signedIdVerifier` raise a real `ArgumentError`
(`vendor/rails/activerecord/lib/active_record/signed_id.rb:78`), but the class
is a file-local `class ArgumentError extends Error` in
`packages/activerecord/src/signed-id.ts`, unexported, so the test cannot name
it without either exporting it or matching on `error.name`.

Note the repo has no shared Ruby-core `ArgumentError`: the settled idiom is a
file-local class per module (`activesupport/src/error-reporter.ts`,
`actionview/src/helpers/tag-helper.ts`, …). See the related draft story
`argument-error-helper-returns-bare-error`.

## Converged shape

Both tests assert the ArgumentError class the way `assert_raises(ArgumentError)`
does — either by exporting the class from `signed-id.ts` and passing it to
`toThrow`, or via whatever the repo settles on for Ruby-core error classes.
Test names stay verbatim.

## Acceptance criteria

- [ ] Both tests assert the error class, not bare `toThrow()`.
- [ ] Test names unchanged; `pnpm parity:test:assertions` delta non-negative.
- [ ] `signed-id.test.ts` passes on all three adapters.

## Re-homed from `0023-surfaced-deviations` (2026-08-18)

Moved by the RFC 0023 backlog triage pass into `0111-error-class-message-parity`, which was carved out
of that register for this deviation class. Nothing about the finding changed —
every Rails and trails `file:line` citation above is as originally filed.
