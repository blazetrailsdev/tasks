---
title: "ResponseAssertions: RESPONSE_PREDICATES, response_code and the redirect handle still diverge from response.rb"
status: draft
updated: 2026-10-01
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: ["actionpack"]
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#8322 converged most of
`packages/actionpack/src/action-dispatch/testing/assertions/response.ts` onto
`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/testing/assertions/response.rb`:
`assert_redirected_to` (`:59-70`), the lazy message in `assert_response`
(`:33-41`), `location_if_redirected` and `exception_if_present` (`:97-108`).
That ships most of `response-assertions-converge-assert-redirected-to` (RFC
0141), which should be re-scoped to what is left. Two things in that story
remain, and one is not in it:

- `RESPONSE_PREDICATES` (`response.rb:9-14`) maps a type to a predicate NAME
  (`success: :successful?`, `missing: :not_found?`, `redirect: :redirection?`,
  `error: :server_error?`) and `assert_response` sends it:
  `assert @response.public_send(RESPONSE_PREDICATES[type]), message` (`:36-37`).
  trails maps each type to a lambda over the status number, re-deriving the
  ranges by hand. The other arm compares `@response.response_code` (`:39`);
  trails reads `response.status` and `parseInt`s `AssertionResponse#code`.
- `normalize_argument_to_redirection` (`:76-83`) is
  `handle = @controller || ActionController::Redirecting`. trails probes the
  controller for `_computeRedirectToLocation` and falls back to the module
  function when the controller lacks it, a branch Rails does not have.
- `AssertionResponseHost` / `AssertionResponseLike` are invented host types
  with optional members; the Rails module reads `@response`, `@request` and
  `@controller`.

## Acceptance criteria

- `RESPONSE_PREDICATES` holds the predicate names and `assertResponse` sends
  them to the response; the code arm compares `response.responseCode`.
- `normalizeArgumentToRedirection` is the two-arm Rails body.
- The fake responses in `response.test.ts` and
  `assertions/response-assertions.test.ts` answer the four predicates, as
  `FakeResponse` does in `actionpack/test/assertions/response_assertions_test.rb:11-23`.
