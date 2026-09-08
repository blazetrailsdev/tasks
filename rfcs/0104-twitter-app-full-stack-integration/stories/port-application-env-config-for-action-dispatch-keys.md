---
title: "Port Rails::Application#env_config so request envs carry the action_dispatch cookie keys"
status: draft
updated: 2026-09-08
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Rails::Application#env_config`
(`vendor/rails/railties/lib/rails/application.rb:322-352`) copies the
`config.action_dispatch.*` settings into every request's Rack env — the
`"action_dispatch.key_generator"`, `"action_dispatch.signed_cookie_salt"`,
`"action_dispatch.cookies_rotations"` (`:339`), `"action_dispatch.cookies_serializer"`,
`"action_dispatch.use_cookies_with_metadata"` keys that
`ActionDispatch::Cookies`' jars read through `ChainedCookieJars` /
`SerializedCookieJars`.

trails has not ported it. `packages/trailties/src/application.ts` has no
`envConfig`, so nothing bridges the trailtie defaults seeded in
`packages/trailties/src/trailties/action-dispatch.ts` to a request env. Every
consumer that needs a jar seeds those keys by hand: PR #7600 had to add
`"action_dispatch.cookies_rotations": new RotationConfiguration()` to five
separate test env builders
(`action-dispatch/dispatch/cookies.test.ts`,
`action-dispatch/testing/integration.test.ts`,
`action-controller/controller/integration.test.ts`,
`action-controller/metal/request-forgery-protection.trails.test.ts`,
`action-dispatch/dispatch/session/cookie-store.trails.test.ts`) because the
jar constructors read `request.cookies_rotations.signed` with no guard, exactly
as Ruby does at `actionpack/lib/action_dispatch/middleware/cookies.rb:628`.

Rails' own tests seed the same keys on `@request.env` directly
(`actionpack/test/dispatch/cookies_test.rb:389`), so the test-side seeding is
faithful; the gap is that a booted trails app has no path to those keys at all.

## Converged shape

`Application#envConfig` on `packages/trailties/src/application.ts`, mirroring
`application.rb:322-352` key for key, memoized in `@app_env_config` and merged
over `Engine#env_config`. Each of the five test env builders above then keeps
its explicit seeding only where Rails' test does.

## Acceptance criteria

- [ ] `Application#envConfig` ported per `railties/lib/rails/application.rb:322-352`,
      with the same keys in the same order.
- [ ] A booted trails app serves a request whose env carries
      `action_dispatch.cookies_rotations`, `action_dispatch.key_generator` and
      the cookie salts, verified by a test that builds a jar off that env.
- [ ] No jar-side null guard is introduced: the readers stay as bare as
      `cookies.rb:628`.
