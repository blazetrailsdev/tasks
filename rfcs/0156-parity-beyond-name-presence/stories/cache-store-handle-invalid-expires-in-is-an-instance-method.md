---
title: "cache-store-handle-invalid-expires-in-is-an-instance-method"
status: closed
updated: 2026-10-11
rfc: "0156-parity-beyond-name-presence"
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
closed-reason: "FALSIFIED: converged in trails#8795 in the review round after it was filed"
---

## Context

`ActiveSupport::Cache::Store#handle_invalid_expires_in` is a private instance method
(`vendor/rails/v8.0.2/activesupport/lib/active_support/cache.rb:890-898`) that reads the
instance `logger` reader (`cache.rb:896`). trails ports it as
`static handleInvalidExpiresIn` on `Store` (`packages/activesupport/src/cache/store.ts`), called
as `Store.handleInvalidExpiresIn(...)` and reading `Store.logger`. `Store.with` beside it has no
Rails counterpart in `cache.rb`.

## Acceptance criteria

- `handleInvalidExpiresIn` is a private instance method called as `this.handleInvalidExpiresIn`
  and reads `this.logger` (`cache.rb:877,896`); its trails-only test in
  `cache/cache-store-base.test.ts` follows.
- `Store.with` is removed or traced to a Rails method.
