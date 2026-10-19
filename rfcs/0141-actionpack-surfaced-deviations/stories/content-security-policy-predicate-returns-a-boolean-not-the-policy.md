---
title: "content-security-policy-predicate-returns-a-boolean-not-the-policy"
status: closed
updated: 2026-10-19
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Verified against trails origin/main (6ccf009f20) during 0141 refine 2026-10-19: isContentSecurityPolicy returns request.contentSecurityPolicy (content-security-policy.ts:64-67), current* uses rbObjClone (:76-78), contentSecurityPolicy takes (enabled=true, options, block) with no resolved* names"
---

## Context

`ActionController::ContentSecurityPolicy#content_security_policy?`
(`vendor/rails/v8.0.2/actionpack/lib/action_controller/metal/content_security_policy.rb:74-76`)
is `request.content_security_policy`: it answers the policy or `nil`, not a
boolean. The port, `isContentSecurityPolicy`
(`packages/actionpack/src/action-controller/metal/content-security-policy.ts:85-87`),
returns `this.request.contentSecurityPolicy != null`.

In the same file `current_content_security_policy` (`:82-84`) is
`request.content_security_policy&.clone || ActionDispatch::ContentSecurityPolicy.new`.
The port calls `current.dup()` where Rails calls `clone`.

`content_security_policy` (`:39-51`) and `content_security_policy_report_only`
(`:66-70`) take `(enabled = true, **options, &block)`. The port re-sorts three
positional arguments by `typeof` into `resolvedEnabled` / `resolvedOptions` /
`resolvedBlock`, names Rails does not have.

Found while closing `base-included-modules-dispatch-privates-through-self`.

## Acceptance criteria

- `isContentSecurityPolicy` returns `this.request.contentSecurityPolicy`, and
  its unit test in `content-security-policy.test.ts` asserts the value.
- `currentContentSecurityPolicy` calls `rbObjClone` where Rails calls `clone`.
- The two class methods keep Rails' parameter names and the settled trails
  kwargs-and-block shape, with no `resolved*` locals.
- `pnpm parity:api:calls` and `pnpm parity:api:predicates` stay green.
