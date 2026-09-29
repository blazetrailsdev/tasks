---
title: "port-action-controller-request-forgery-protection-initializer"
status: claimed
updated: 2026-09-29
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 1
pr: null
claim: "2026-09-29T15:58:59Z"
assignee: "port-action-controller-request-forgery-protection-initializer"
blocked-by: null
closed-reason: null
---

## Context

Rails' `ActionController::Railtie` has
`initializer "action_controller.request_forgery_protection"`
(`vendor/rails/v8.0.2/actionpack/lib/action_controller/railtie.rb:102-107`), which on
`:action_controller_base` load runs `protect_from_forgery with: :exception`
when `app.config.action_controller.default_protect_from_forgery` is set.
`load_defaults "5.2"` and later set it (trails: `packages/trailties/src/application/configuration.ts:147`).

trails sets the config flag but nothing reads it. No initializer or
`protectFromForgery` call exists in `packages/actionpack` or
`packages/trailties`. A freshly generated app (`trails new` + `generate scaffold`)
accepts a token-less `POST /posts` and creates the row, where Rails raises
`ActionController::InvalidAuthenticityToken`.

Found re-running the root README quickstart (PR #8195) on `main` at `c19bfc0aee`:
`curl -X POST localhost:3000/posts -d 'post[title]=x'` inserted a row.

## Acceptance criteria

- [ ] The initializer is ported in the action_controller railtie, gated on
      `defaultProtectFromForgery`, per `railtie.rb:102-107`.
- [ ] A generated app rejects a token-less non-GET request with
      `InvalidAuthenticityToken`, and a test covers it.
