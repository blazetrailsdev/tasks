---
title: "ActionController::TestCase never installs protectFromForgery from defaultProtectFromForgery, because a test cannot boot the application"
status: draft
updated: 2026-10-29
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/trailties/src/trailties/action-controller.ts` (vendored dist
`trailties/action-controller.js:60`) calls `protectFromForgery` on
`ActionController::Base` only when the action_controller trailtie's
initializer runs with `defaultProtectFromForgery` set — which
`application/configuration.js:119` sets under `loadDefaults`. Under vitest
the application is never booted, so `ActionController::TestCase` drives a
`Base` with no forgery callback at all.

Surfaced by trailmap#94 (`test/controllers/rfc-status.test.ts`, "writes an
authenticity token into each buttonTo form"): with
`ApplicationController.allowForgeryProtection = true`, a POST with no
`authenticity_token` returns 303 and performs the mutation. Rails 8.0.2
(`rails/test/controllers/rfc_status_test.rb` in trailmap) returns 422,
because `ActionController::Base` there already carries
`protect_from_forgery with: :exception` from boot.

Expected shape: a controller test that flips `allowForgeryProtection` on
sees the same refusal Rails does (`InvalidAuthenticityToken` -> 422),
without the application booting — or the TestCase harness applies the
action_controller trailtie's `on_load` defaults the way Rails' test
environment inherits them.

## Acceptance criteria

- A trails test: an `ActionController::TestCase` against an app configured
  with `loadDefaults`, `allowForgeryProtection = true`, POSTs without a token
  and gets 422; with the token from a rendered `buttonTo`, it succeeds.
- trailmap's `rfc-status.test.ts` can then assert the tokenless refusal, and
  its comment pointing here is deleted.
