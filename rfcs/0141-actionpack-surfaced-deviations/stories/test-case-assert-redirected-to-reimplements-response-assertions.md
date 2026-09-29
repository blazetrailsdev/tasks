---
title: "ActionController::TestCase#assertRedirectedTo reimplements ResponseAssertions#assert_redirected_to"
status: draft
updated: 2026-09-29
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActionController::TestCase` includes `ActionDispatch::Assertions` (`vendor/rails/v8.0.2/actionpack/lib/action_controller/test_case.rb`, `include ActionDispatch::Assertions`), so its `assert_redirected_to` IS `ActionDispatch::Assertions::ResponseAssertions#assert_redirected_to` (`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/testing/assertions/response.rb:60-72`).

trails' `ActionController::TestCase#assertRedirectedTo` (`packages/actionpack/src/action-controller/test-case.ts`) is a separate hand-rolled method. trails#8244 made it normalize both sides through `_computeRedirectToLocation`, but it still:

- takes only `(expected)`, with no `options` (`status:`) or `message` arguments;
- skips `assert_response(status, message)`;
- has no `url_options === @response.location` early return;
- throws its own messages (`Expected redirect to "…", got "…"`) instead of Rails' `Expected response to be a redirect to <…> but was a redirect to <…>`.

`packages/actionpack/src/action-dispatch/testing/assertions/response.ts` already ports the Rails body, and the integration session uses it (`integration.ts`, `proto.assertRedirectedTo = responseAssertions.assertRedirectedTo`).

## Acceptance criteria

- `ActionController::TestCase` answers `assertRedirectedTo` with the ported `ResponseAssertions#assertRedirectedTo` (mixed in as `integration.ts` does), and the hand-rolled method is deleted.
- The `TestCaseTest > assertRedirectedTo` cases still pass, now through Rails' message and status arms.
