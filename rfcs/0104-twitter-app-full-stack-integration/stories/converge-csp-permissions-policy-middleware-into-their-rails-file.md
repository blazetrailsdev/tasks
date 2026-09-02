---
title: "CSP/PermissionsPolicy Middleware lives in a trails-only middleware/ file, not its Rails http/ file"
status: done
updated: 2026-09-02
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 260
priority: 7
pr: 7385
claim: "2026-09-02T12:05:56Z"
assignee: "converge-csp-permissions-policy-middleware-into-their-rails-file"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by PR #7173, which stopped dropping same-file-nested Rails classes
from the parity population. `ContentSecurityPolicy::Middleware` is one of
those classes, and once measured it reports two methods missing that are in
fact ported — just in a file Rails does not have.

Rails keeps the middleware in the same file as the policy object:
`actionpack/lib/action_dispatch/http/content_security_policy.rb:32-63` defines
`class Middleware` with `call(env)` (`:37-56`) and the private `header_name`
(`:59`) and `policy_present?`. `actionpack/lib/action_dispatch/http/permissions_policy.rb`
has the identical shape.

trails splits each into two files: the policy object at
`packages/actionpack/src/action-dispatch/http/content-security-policy.ts` and
the middleware at
`packages/actionpack/src/action-dispatch/middleware/content-security-policy.ts`
(`ContentSecurityPolicyMiddleware`, `call` at `:20`, `headerName` at `:43`,
`policyPresent` at `:49`). `RUBY_FILE_TS_OVERRIDES` is per Ruby FILE, so it
cannot express "these 27 methods here, those 3 over there" — the rest of
content_security_policy.rb maps correctly to the http/ file, and the
middleware's three methods have nowhere to be credited.

Until #7173 this was invisible twice over: the nested class was outside the
population, and the include-move credit (fixed in the same PR) was crediting
`Middleware#call` to `http/request.ts`, whose only `call` is `PASS_NOT_FOUND`'s
(`request.rb:82`) — an unrelated body the call gates then compared against.

The class name is also renamed: Rails' `ContentSecurityPolicy::Middleware`
against trails' `ContentSecurityPolicyMiddleware`.

## Acceptance criteria

- Move both middlewares into the files their Rails counterparts live in —
  `http/content-security-policy.ts` and `http/permissions-policy.ts` — and
  drop the two `middleware/` files, updating importers (the trailtie /
  middleware-stack wiring is the main one).
- Keep the Rails name: nested `Middleware`, not a flattened
  `<Policy>Middleware`, unless a TS shortcoming forces the flattening, in
  which case cite it at the call site.
- `header_name` and `policy_present?` stay private, as in Rails.
- `pnpm parity:api --package actiondispatch` credits all three methods to the
  http/ file, and `pnpm parity:api:calls` stays green.
