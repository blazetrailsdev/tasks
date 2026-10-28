---
title: "Break the request.ts cycle so actionpack's five remaining Request reads become imports"
status: blocked
updated: 2026-10-28
rfc: "0205-namespace-seats-are-plain-javascript"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: "2026-10-28T14:19:08Z"
assignee: "native-fetch-ternary-sites-audit-forwarded-undefined-keywords"
blocked-by: "Needs owner decision: reproduced — csp.ts importing Request from request.ts makes 'CspRequest' TDZ when csp.ts is the entry (request.ts:856 include(Request, CspRequest) runs before csp.ts body). Rails includes ContentSecurityPolicy::Request in request.rb:27 and the module lives in content_security_policy.rb, so no file move keeps Rails layout; every static-ESM fix needs the mixin hoisted or moved. Namespace read is the sanctioned module-eval shape."
closed-reason: null
---

## Context

The actionpack sweep (trails#9376) left five call-time `ActionDispatch.Request` / `ActionDispatch.MissingController` / `ActionDispatch.Request.Utils` namespace reads. Turning each into a plain import from `action-dispatch/http/request.ts` caused a module-eval TDZ when the importing module was loaded as a plain-node entry. The errors read `CspRequest`, `PermissionsPolicyRequest`, `keyGenerator`, `Utils` and `ParseError` before they were initialised. The importing modules:

- `packages/actionpack/src/action-dispatch/http/content-security-policy.ts` (`new ActionDispatch.Request(env)`; Rails `content_security_policy.rb:46`)
- `packages/actionpack/src/action-dispatch/http/permissions-policy.ts` (Rails `permissions_policy.rb:42`)
- `packages/actionpack/src/action-dispatch/middleware/cookies.ts` (Rails `cookies.rb:705`)
- `packages/actionpack/src/action-dispatch/request/utils.ts` (`rescue MissingController`; Rails `request/utils.rb:109`)
- `packages/actionpack/src/action-dispatch/http/parameters.ts` (`Request::Utils`; Rails `http/parameters.rb`)

Rails names each of these constants directly, and Zeitwerk or a `require` resolves it. In trails, the `request.ts` module graph closes cycles whose `class … extends` runs at module eval.

## Acceptance criteria

- [ ] Find which `extends` or top-level call in the `request.ts` cycle reads a binding in TDZ, and converge that edge so it is a call-time read. For example, move a class to the file that mirrors its `.rb`.
- [ ] All five reads above become plain ES imports.
- [ ] Each converted module and `dist/index.js` load as plain-node ESM entries.
