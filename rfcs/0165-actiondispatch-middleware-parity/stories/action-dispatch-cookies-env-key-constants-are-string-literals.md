---
title: "Seat ActionDispatch::Cookies' env-key constants"
status: draft
updated: 2026-10-05
rfc: "0165-actiondispatch-middleware-parity"
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

`ActionDispatch::Cookies` defines its env-key constants at
`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/middleware/cookies.rb:197-210`
(`GENERATOR_KEY`, `SIGNED_COOKIE_SALT`, ..., `COOKIES_ROTATIONS`,
`COOKIES_SAME_SITE_PROTECTION`, `USE_COOKIES_WITH_METADATA`), and
`RequestCookieMethods` reads them as `get_header Cookies::GENERATOR_KEY`
(`cookies.rb:35`, `:83`).

`packages/actionpack/src/action-dispatch/middleware/cookies.ts` exports only
`COOKIES_SAME_SITE_PROTECTION` (`:57`); the rest are string literals passed to
`requestEnvAccessor` (`:665`, `:709`) and to `Request#keyGenerator`
(`packages/actionpack/src/action-dispatch/http/request.ts:649`). Tests that
Rails writes against the constants repeat the literals:
`packages/actionpack/src/action-controller/controller/flash.test.ts:181-182` and
`RequestForgeryProtectionControllerUsingNullSessionTest`'s setup in
`packages/actionpack/src/action-controller/controller/request-forgery-protection.test.ts`
(Rails `test/controller/request_forgery_protection_test.rb:747-748`).

## Acceptance criteria

- Each constant at `cookies.rb:197-210` is seated on `ActionDispatch::Cookies`
  at its Rails name, and the readers in `cookies.ts` / `request.ts` name it.
- The two test setups above read `Cookies.GENERATOR_KEY` /
  `Cookies.COOKIES_ROTATIONS` instead of string literals.
