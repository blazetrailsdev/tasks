---
title: "Rack Request#cookies and CookieJar.build/update dispatch through Hash#replace/update"
status: draft
updated: 2026-11-06
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

Rack's `Request#cookies` (`packages/rack/src/request.ts:316-330`) clears and refills the cookie hash with `delete` / `Object.assign`, and is typed `Record<string, string>`. Rack runs `hash.replace Utils.parse_cookies_header(string)` (`vendor/rack/*/lib/rack/request.rb:293-306`). `ActionDispatch::Cookies::CookieJar.build` and `#update` (`packages/actionpack/src/action-dispatch/middleware/cookies.ts:197-236`) copy with `Object.entries`, where Rails runs `jar.update(cookies)` / `@cookies.update other_hash.stringify_keys` (`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/middleware/cookies.rb:316-320,361-364`). Because of both, a `HashWithIndifferentAccess` (Map-backed) seed in `rack.request.cookie_hash` is never read. That blocks `action-controller-test-request-create-drops-the-env-config-merge`, which was tried and released in trails#9768.

## Acceptance criteria

- `Request#cookies` uses ruby-compat `hashReplace` and is typed `Record<string, string> | Map<string, string>`. Its callers and tests read it through a dispatching accessor where the receiver may be a Hash.
- `CookieJar.build` calls `jar.update(cookies)`, and `update` uses ruby-compat `update`.
- `action-controller-test-request-create-drops-the-env-config-merge` can then seed `withIndifferentAccess({})`.
