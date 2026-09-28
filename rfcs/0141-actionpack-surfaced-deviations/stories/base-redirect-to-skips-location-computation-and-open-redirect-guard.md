---
title: "Base#redirectTo skips _compute_redirect_to_location, the nil guard and open-redirect enforcement"
status: draft
updated: 2026-09-28
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

Raised in review of trails#8227. That PR fixed only the write order.
`Base#redirectTo` (`packages/actionpack/src/action-controller/base.ts`, after
the flash extraction) still writes the caller's string straight into
`Location`. Rails' `Redirecting#redirect_to`
(`vendor/rails/v8.0.2/actionpack/lib/action_controller/metal/redirecting.rb:103-117`)
does more:

- `raise ActionControllerError.new("Cannot redirect to nil!") unless options` (`:104`)
- `allow_other_host = response_options.delete(:allow_other_host) { _allow_other_host }` (`:107`)
- `_extract_redirect_to_status(options, response_options)` (`:109`, `:213-221`)
- `_compute_redirect_to_location(request, options)` (`:111`, `:159-174`). This
  makes a path absolute (`request.protocol + request.host_with_port + options`)
  and removes `\0\r\n`.
- `_ensure_url_is_http_header_safe` (`:112`, `:245-252`)
- `self.location = _enforce_open_redirect_protection(...)` (`:114`, `:223-229`)

All of these helpers are already ported as `this`-typed functions in
`packages/actionpack/src/action-controller/metal/redirecting.ts`, but nothing
calls them from `Base`. `redirectBack` also passes `{ status: options.status }`,
which becomes `status: undefined`. Once `_extract_redirect_to_status`'s
`key?(:status)` check is in place, that raises "Unrecognized status code
:undefined". It should forward the remaining options the way `redirect_back`
does (`:124-126`). The option key should be `allowOtherHost` (RFC 0149), which
`redirectBackOrTo` already passes; `Base` currently spells it `allow_other_host`.

The test side has two changes:

- `normalizeArgumentToRedirection`
  (`packages/actionpack/src/action-dispatch/testing/assertions/response.ts`)
  returns the fragment unchanged when there is no controller handle. Rails
  falls back to `ActionController::Redirecting._compute_redirect_to_location`
  (`action_dispatch/testing/assertions/response.rb:79-86`, module_function at
  `redirecting.rb:175-176`).
- `assertRedirectedTo` skips Rails' early
  `return true if url_options === @response.location` (`response.rb:65`).
- The invented `TestCase#assertRedirectedTo`
  (`action-controller/test-case.ts`) compares raw strings, so
  `assert_redirected_to "/posts"` stops matching once `Location` is absolute.
  Normalize both sides through `normalizeArgumentToRedirection`, or swap it for
  the `ResponseAssertions` port per
  `port-action-pack-assertions-routing-and-redirect-skips`.

A working prototype of all of this, about 60 LOC, was measured on the #8227
worktree. All actionpack `action-controller` and `action-dispatch` tests passed
after these test updates:

- trails-only tests that expected a relative `Location` now expect
  `http://localhost/...` (`controller/base.test.ts`, `controller/redirect.test.ts`)
- `redirect invalid external route` expects
  `http://test.hostht_tp://www.rubyonrails.org`, as Rails does
  (`actionpack/test/controller/action_pack_assertions_test.rb:426-429`)
- the fake host in `assertions/response.test.ts` gets
  `request: { protocol: "http://", hostWithPort: "test.host" }`

`parity:api:calls` and `parity:api:calls:args` were green.

This overlaps with `split-redirect-to-into-redirecting-and-flash`, which moves
the body into `metal/redirecting.ts`. Whichever lands first should carry the
body convergence.

## Acceptance criteria

- `redirectTo` runs Rails' `:104-116` sequence through the ported
  `metal/redirecting.ts` helpers: nil guard, double-render guard,
  allow_other_host, status, compute location, header-safe check, open-redirect
  enforcement, then location, empty body, status.
- `redirectBack` forwards its remaining options, and `allowOtherHost` is the
  option key.
- `normalizeArgumentToRedirection` falls back to the module
  `_computeRedirectToLocation`, and `assertRedirectedTo` has the `===` early
  return.
- Redirect tests assert Rails' absolute `Location`.
