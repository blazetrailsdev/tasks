---
title: "rack-session-commit-session-expiry-reads-time-now"
status: draft
updated: 2026-10-18
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
closed-reason: null
---

## Context

`Rack::Session::Abstract::Persisted#commit_session`
(`vendor/rack-session/v2.1.0/lib/rack/session/abstract/id.rb:400-405`) computes
`cookie[:expires] = Time.now + options[:expire_after]` (and the same for
`:max_age`). trails' `packages/rack-session/src/abstract/id.ts:539-548` uses
`new Date(Date.now() + expireAfter * 1000)`, so a test that stubs `Time.now`
(`stub(Time, "now", ...)` from `@blazetrails/activesupport`) does not move the
cookie expiry.

Two `CookieStoreTest` tests in
`packages/actionpack/src/action-dispatch/dispatch/session/cookie-store.test.ts`
("session store with expire after", "session store with expire after does not
accept expired session"; Rails
`vendor/rails/v8.0.2/actionpack/test/dispatch/session/cookie_store_test.rb:315-370`)
are parked as `it.skip` on this story.

## Acceptance criteria

- `commit_session` reads `Time.now` (ruby-compat / date `Time`) and adds the
  `expire_after` / `max_age` seconds, as Rails does.
- The two parked CookieStoreTest tests are un-skipped and pass.
