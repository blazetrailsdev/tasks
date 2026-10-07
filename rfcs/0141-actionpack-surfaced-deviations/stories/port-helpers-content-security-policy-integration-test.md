---
title: "Port HelpersContentSecurityPolicyIntegrationTest; move the TS-only permissions policy test to .trails.test.ts"
status: draft
updated: 2026-10-07
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

`HelpersContentSecurityPolicyIntegrationTest` (`vendor/rails/v8.0.2/actionpack/test/dispatch/content_security_policy_test.rb:763-833`) is parked as an empty `it.skip("can call helper methods in csp", () => {})` in `packages/actionpack/src/action-dispatch/dispatch/content-security-policy.test.ts` (the last `describe`). It has no `PERMANENT-SKIP:` line and nothing blocks it.

Its twin, `PermissionsPolicyWithHelpersIntegrationTest`, was ported in trails#8618 (`packages/actionpack/src/action-dispatch/dispatch/permissions-policy.test.ts`), and shows the working shape:

- the namespaced `ApplicationHelper` module registered with `registerConstant` before the controller class is defined, so `default_helper_module!` finds it;
- `ApplicationController` carrying its namespaced name as `static override name`, with `this.helperMethod("isSkyIsBlue")` in a `static {}` block where Rails has `helper_method :sky_is_blue?` (`:771`);
- the policy block reading `this.helpers().isSkyIsBlue()` / `isPigsCanFly()`;
- `ROUTES`, `PolicyConfigMiddleware` and `APP` built with `IntegrationTest.buildApp`, with `Rack::Lint` around the middleware.

The same file also holds a TS-only test, `describe("PermissionsPolicy constructor block") › "accepts a block"` in `permissions-policy.test.ts`, which has no Rails counterpart and shows as the file's one `extra (TS only)` in `pnpm parity:test`.

## Acceptance criteria

- [ ] "can call helper methods in csp" is a running port of `content_security_policy_test.rb:763-833`: `PolicyController < ApplicationController` with the `content_security_policy` block at `:778-781`, the routes at `:789-793`, the middleware stack at `:813-818`, and `assert_policy` reading the real `Content-Security-Policy` header. Note the Rails name is `def test_can_call_helper_methods_in_csp`, which `parity:test` maps to `can call helper methods in csp`.
- [ ] `permissions-policy.test.ts`'s "accepts a block" moves to a `permissions-policy.trails.test.ts` beside it, and `dispatch/permissions_policy_test.rb` reads 12/12 with no extra.
- [ ] `pnpm parity:test` and `pnpm parity:test:assertions` stay green.
