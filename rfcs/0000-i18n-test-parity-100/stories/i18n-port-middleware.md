---
title: "i18n: port I18n::Middleware and test/i18n/middleware_test.rb"
status: draft
updated: 2026-11-17
rfc: "0000-i18n-test-parity-100"
cluster: residuals
packages: [i18n]
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

`vendor/i18n/v1.14.8/lib/i18n/middleware.rb:1-17` is `call(env)` that runs `@app.call(env)`
and then sets `I18n.config = I18n::Config.new` in an `ensure`. Its exclusion
(`scripts/parity/unported-files/i18n.ts`, "trails has no Rack request lifecycle
wiring for i18n yet") is a deferral, not a limit. The class needs no Rack import.

`vendor/i18n/v1.14.8/test/i18n/middleware_test.rb:11-23` has 2 tests. One compares
`Thread.current.thread_variable_get(:i18n_config).object_id` before and after
the call. That is identity, so use `not.toBe` on the two `threadVariableGet`
reads (`packages/i18n/lib/i18n.ts:50`). Its `DummyRackApp` is in
`vendor/i18n/v1.14.8/test/test_helper.rb`.

## Acceptance criteria

- [ ] `packages/i18n/lib/middleware.ts` mirrors `middleware.rb`, with the
      `ensure` as `rbEnsure` or `try/finally`, and awaits the app call if a
      Rack app's `call` is async in trails.
- [ ] `packages/i18n/test/middleware.test.ts` ports both tests under the Rails names.
- [ ] The `middleware.rb` exclusion row is deleted.
