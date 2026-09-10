---
title: "action-dispatch redeclares UnknownFormat and InvalidAuthenticityToken beside the ActionController ports"
status: draft
updated: 2026-09-10
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 100
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by trails#7677. Rails defines `UnknownFormat` once,
`vendor/rails/actionpack/lib/action_controller/metal/exceptions.rb` (`ActionController::UnknownFormat`),
and `InvalidAuthenticityToken` once,
`actionpack/lib/action_controller/metal/request_forgery_protection.rb` (`ActionController::InvalidAuthenticityToken`).

trails declares each twice: the ports in
`packages/actionpack/src/action-controller/metal/exceptions.ts` and
`.../metal/request-forgery-protection.ts`, plus invented duplicates in
`packages/actionpack/src/action-dispatch/respond-to.ts` (thrown by
`action-controller/metal/mime-responds.ts`) and
`packages/actionpack/src/action-dispatch/request-forgery-protection.ts`
(used by `action-controller/base.ts`). #7677 gave both duplicates the qualified
name so ExceptionWrapper still matches, but `instanceof` against the ported
class misses errors thrown from the duplicate path.

## Converged shape

Delete the action-dispatch duplicates; every raise site and the
`action-dispatch/index.ts` re-export use the `ActionController` classes.

## Acceptance criteria

- [ ] One `UnknownFormat` and one `InvalidAuthenticityToken` class in actionpack.
- [ ] mime-responds / Base raise the ActionController classes; respond_to and request-forgery suites green.
