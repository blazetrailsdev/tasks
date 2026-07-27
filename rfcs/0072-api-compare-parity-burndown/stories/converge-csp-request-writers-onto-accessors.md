---
title: "converge-csp-request-writers-onto-accessors"
status: in-progress
updated: 2026-07-27
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 5405
claim: "2026-07-27T13:49:06Z"
assignee: "converge-csp-request-writers-onto-accessors"
blocked-by: null
closed-reason: null
---

## Context

From the `audit-set-prefixed-writers-for-accessor-convergence` inventory.
`scripts/api-compare/conventions.ts` maps a Ruby writer `foo=` onto the SAME
camelCase name as its reader, so an `export function setFoo` sibling is TS
surface Rails does not have.

`packages/actionpack/src/action-dispatch/http/content-security-policy.ts`
exports four such writers, each with its reader in the same TS file and the
matching Ruby reader/writer pair in
`vendor/rails/actionpack/lib/action_dispatch/http/content_security_policy.rb`:

- `setContentSecurityPolicy` (line 411) / `contentSecurityPolicy`
- `setContentSecurityPolicyReportOnly` (line 422) / `contentSecurityPolicyReportOnly`
- `setContentSecurityPolicyNonceGenerator` (line 432)
- `setContentSecurityPolicyNonceDirectives` (line 445)

Rails declares these on the request via `Request` helper methods that read and
write `set_header`/`get_header` slots.

The converged shape is an exported class module holding `get`/`set` accessor
pairs under the Rails name, mixed into hosts via `include()` from
`@blazetrails/activesupport`, or by deriving the mixin host from the class
prototype. Exemplar:
`packages/actionpack/src/action-dispatch/http/mime-negotiation.ts`.

## Acceptance criteria

- All four `set`-prefixed exports replaced by accessors under the Rails name.
- `Request` exposes the pairs as `get`/`set` accessors; call sites updated.
- No new extra-surface allowlist entries or `@noRailsEquivalent` tags.
- Existing actionpack tests stay green.
