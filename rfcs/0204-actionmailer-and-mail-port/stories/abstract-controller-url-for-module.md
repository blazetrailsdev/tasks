---
title: "abstract-controller-url-for-module"
status: done
updated: 2026-11-06
rfc: "0204-actionmailer-and-mail-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#9771
claim: "2026-11-06T02:37:13Z"
assignee: "abstract-controller-url-for-module"
blocked-by: null
closed-reason: null
---

## Context

`AbstractController::UrlFor` (`vendor/rails/v8.0.2/actionpack/lib/abstract_controller/url_for.rb:1-35`)
is an `ActiveSupport::Concern` that includes `ActionDispatch::Routing::UrlFor`
and defines `_routes` plus `ClassMethods#_routes` / `action_methods`. trails'
`packages/actionpack/src/abstract-controller/url-for.ts` holds only loose
functions and constants, so nothing can `include AbstractController::UrlFor`.

`ActionMailer::Railtie`'s `action_mailer.set_configs` on_load block
(`vendor/rails/v8.0.2/actionmailer/lib/action_mailer/railtie.rb:37`) does
`include AbstractController::UrlFor`; the port in
`packages/trailties/src/trailties/action-mailer.ts` includes
`ActionDispatch.Routing.UrlFor` instead, under a
`@missingRailsCall AbstractController::UrlFor — CONVERGEABLE abstract-controller-url-for-module` receipt.

## Acceptance criteria

- `AbstractController.UrlFor` exists as an includable module mirroring url_for.rb
  (includes `ActionDispatch::Routing::UrlFor`, `_routes` raise, class-side
  `_routes` / `action_methods`).
- `action-mailer.ts` includes `AbstractController.UrlFor` and the receipt is removed.
