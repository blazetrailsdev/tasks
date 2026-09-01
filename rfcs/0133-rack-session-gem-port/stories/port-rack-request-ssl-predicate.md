---
title: "Port Rack::Request#ssl? so security_matches? and secure cookies stop guarding a missing method"
status: draft
updated: 2026-09-01
rfc: "0133-rack-session-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Rack::Request#ssl?` (`vendor/rack/lib/rack/request.rb`, `def ssl?;
scheme == 'https' || scheme == 'wss'; end`) is not ported, so two call sites
guard a method that never exists and silently take the false arm:

- `packages/actionpack/src/action-dispatch/middleware/session/abstract-store.ts`,
  `Persisted#isSecurityMatches` — Rails is
  ```ruby
  def security_matches?(request, options)   # abstract/id.rb:371-374
    return true unless options[:secure]
    request.ssl? || @assume_ssl == true
  end
  ```
  trails writes `request.isSsl?.() === true || this.assumeSsl === true` and
  carries a `@missingRailsCall ssl?` receipt (added by PR #7317). The
  consequence is real: a store configured `secure: true` can never commit its
  session, because `security_matches?` is false on every request including
  genuine HTTPS ones.
- `packages/actionpack/src/action-dispatch/middleware/cookies.ts:297` guards the
  same absent method the same way, for the `secure` cookie decision.

`Rack::Request::Helpers#scheme` is already ported, so `ssl?` is a two-line
method over an existing base.

## Converged shape

- `ssl?` ported onto `packages/rack/src/request.ts` as `isSsl()`, per
  `docs/ruby-ts-conventions.md`'s bare-predicate rule, over the existing
  `scheme` reader — `scheme === "https" || scheme === "wss"`.
- `Persisted#isSecurityMatches` becomes `request.isSsl() || this.assumeSsl === true`
  with no optional call and no receipt; the `@missingRailsCall ssl?` tag is
  deleted.
- `cookies.ts:297`'s `request?.isSsl?.()` guard converges the same way.

## Acceptance criteria

- `Rack::Request#ssl?` answers on a real request for both `https` and `wss`.
- The `@missingRailsCall ssl?` receipt in `abstract-store.ts` is gone.
- A test covers a `secure: true` session store committing over HTTPS and
  refusing over HTTP — the behaviour the missing method currently breaks.
