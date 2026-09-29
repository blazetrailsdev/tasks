---
title: "ResponseAssertions: assert_redirected_to / normalize_argument_to_redirection / location_if_redirected mirror response.rb"
status: draft
updated: 2026-09-29
rfc: "0141-actionpack-surfaced-deviations"
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
closed-reason: null
---

## Context

`ActionDispatch::Assertions::ResponseAssertions`
(`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/testing/assertions/response.rb:60-110`)
and trails' `packages/actionpack/src/action-dispatch/testing/assertions/response.ts`
still diverge:

- `assert_redirected_to` (`:60-71`) has `return true if url_options === @response.location`
  before normalizing, and it reads `@response.location`. trails reads
  `this.response.getHeader?.("location")` and has no early return. It also finishes with
  a hand-rolled RegExp/`===` compare and `throw new Error`, where Rails uses
  `assert_operator redirect_expected, :===, redirect_is, message`.
- `normalize_argument_to_redirection` (`:80-87`) falls back to
  `ActionController::Redirecting` when `@controller` is nil
  (`handle = @controller || ActionController::Redirecting`). trails returns the fragment
  unchanged when the controller has no `_computeRedirectToLocation`.
- `location_if_redirected` (`:103-108`) is `return "" unless @response.redirection? && @response.location.present?`,
  followed by `location = normalize_argument_to_redirection(@response.location)`. trails reads
  `getHeader` and range-checks the status by hand.
- `assert_response` defines `generate_response_message` as a lambda (`:89-96`). trails
  builds the string eagerly.
- The host types (`AssertionResponseHost`, `AssertionResponseLike` with an optional
  `getHeader`) are invented. The Rails module reads `@response` / `@request` / `@controller`.

## Acceptance criteria

- Each of the four methods mirrors its Rails body and branch order, reading
  `this.response.location` and `isRedirection()`.
- `normalizeArgumentToRedirection` falls back to `ActionController::Redirecting._computeRedirectToLocation`.
- `assertRedirectedTo` asserts through the `assertOperator(... "===" ...)` equivalent, with Rails' message.
