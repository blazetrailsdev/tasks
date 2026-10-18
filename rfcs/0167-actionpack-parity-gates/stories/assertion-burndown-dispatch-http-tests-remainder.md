---
title: "assertion-burndown-dispatch-http-tests-remainder"
status: draft
updated: 2026-10-18
rfc: "0167-actionpack-parity-gates"
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

Remainder of `assertion-burndown-dispatch-http-tests`, whose PR converged
`mime_type_test.rb` and `cookies_test.rb` to zero mismatches and part of
`response_test.rb`, and ran out of LOC before the rest. Measured with
`pnpm parity:test --cached --assertions --missing --package actiondispatch`
on 2026-10-17:

- `vendor/rails/v8.0.2/actionpack/test/dispatch/content_security_policy_test.rb:1-836`
  → `packages/actionpack/src/action-dispatch/dispatch/content-security-policy.test.ts`:
  18 count, 28 kind, 4 value mismatches (9 involve unmapped helpers).
- `vendor/rails/v8.0.2/actionpack/test/dispatch/session/cookie_store_test.rb:1-471`
  → `packages/actionpack/src/action-dispatch/dispatch/session/cookie-store.test.ts`:
  19 count, 27 kind, 5 value (15 unmapped).
- `vendor/rails/v8.0.2/actionpack/test/dispatch/response_test.rb` remaining
  rows: "can wait until commit" / "stream close" (`assert_predicate`,
  `response_test.rb:13-25`), "each isnt called if str body is written"
  (`:42-60`), "message" (`:214-224`), "read ETag and Cache-Control" / "read
  strong ETag" (`:253-283`, need `cache_control[:public] = true` and
  `etag=` on `Response`), "cookies" / "multiple cookies" (unmapped
  `assert_set_cookie_header`).

## Acceptance criteria

- Each real divergence above is converged by porting the Rails assertion;
  unmapped-helper rows are left to `assertion-kinds-map-actionpack-test-assertions`.
- `pnpm parity:test --assertions` shows no divergence rows for these three files.
- `scripts/test-compare/assertion-mismatch-mark.json` is lowered with
  `pnpm parity:test:assertions:reseed`.
