---
title: "Framework controllers skip Rails::ApplicationController, and InfoController's path is info not rails/info"
status: claimed
updated: 2026-09-26
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: 5
pr: null
claim: "2026-09-26T17:42:02Z"
assignee: "journey-route-matches-else-arm-is-case-equality"
blocked-by: null
closed-reason: null
---

## Context

Found while making the framework controllers routable (trails#8093), which
registers `InfoController`, `WelcomeController` and `PWAController` on the
dispatcher's `controllerConstants` under their Rails paths.

- `Rails::InfoController`, `Rails::WelcomeController` and `Rails::PwaController`
  all derive from `Rails::ApplicationController`
  (`vendor/rails/railties/lib/rails/application_controller.rb:3-20`:
  `prepend_view_path File.expand_path("templates", __dir__)`, `layout
"application"`, `before_action :disable_content_security_policy_nonce!`, the
  `content_security_policy` block, and the private `require_local!` /
  `local_request?`). trails has no `Rails::ApplicationController` port, and all
  three derive from `ActionController.Base` directly
  (`packages/trailties/src/info-controller.ts`, `welcome-controller.ts`,
  `pwa-controller.ts`).
- `packages/trailties/src/info-controller.ts` does not override
  `controllerPath()`, so it answers `"info"` where `Rails::InfoController`'s is
  `"rails/info"` (the namespace-derived path; `welcome-controller.ts` and
  `pwa-controller.ts` already override to `rails/welcome` / `rails/pwa`). It also
  drops `prepend_view_path ActionDispatch::DebugView::RESCUES_TEMPLATE_PATHS`,
  the `layout -> { request.xhr? ? false : "application" }` lambda and
  `before_action :require_local!` (`vendor/rails/railties/lib/rails/info_controller.rb:6-10`).

## Acceptance criteria

- [ ] `Rails::ApplicationController` is ported at
      `packages/trailties/src/application-controller.ts` with Rails' class body,
      and the three framework controllers derive from it.
- [ ] `InfoController.controllerPath()` is `"rails/info"`, and its class body
      carries Rails' view path, xhr-aware layout and `require_local!` guard.
- [ ] Rails' `railties/test/rails_info_controller_test.rb` cases that exercise
      the local-request guard and layout are ported with their names verbatim.
