---
title: "cookie-jar-store-types-nil-value"
status: draft
updated: 2026-09-28
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

`ActionDispatch::Cookies::CookieJar#[]=` (`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/middleware/cookies.rb:379-397`)
stores the raw value in `@cookies[name.to_s] = value`, including `nil`
(`cookies["cookie_1"] = nil`, exercised by
`vendor/rails/v8.0.2/actionpack/test/controller/integration_test.rb:238-242`).

trails#8227 converged the `is_a?(Hash)` branch of `CookieJar#set`
(`packages/actionpack/src/action-dispatch/middleware/cookies.ts`), so `set(name, null)`
works. But the private `_cookies` map is typed `Map<string, string>`, so the store
goes through `value as string`. Widening the map to `string | null` ripples through
`get` / `fetch` / `values` / `toHash` / `delete` / `each` / `[Symbol.iterator]`
return types (7 compile errors when tried).

## Acceptance criteria

- `_cookies` is typed to hold Rails' `nil` (`Map<string, string | null>`), and the
  readers' return types say so, matching `cookies.rb`'s `[]`, `fetch`, `to_hash`,
  `delete` and `each`.
- The `value as string` cast in `CookieJar#set` is gone.
- Callers that narrowed on `string` are updated without new casts.
