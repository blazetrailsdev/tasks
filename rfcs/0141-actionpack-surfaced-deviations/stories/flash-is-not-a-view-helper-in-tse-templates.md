---
title: "flash is not a view helper in a .tse template"
status: draft
updated: 2026-11-19
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: ["actionpack", "actionview"]
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

In `examples/cloudflare-worker/app/views/posts/index.html.tse`, `<%= flash().get("notice") %>` raised
`ActionView::Template::Error (__lookup(...) is not a function)`. Rails makes `flash` a view helper through
`helper_method :alert, :notice` and `delegate :flash, to: :request`
(`vendor/rails/v8.0.2/actionpack/lib/action_controller/metal/flash.rb:10-12`,
`vendor/rails/v8.0.2/actionview/lib/action_view/helpers/controller_helper.rb:13-19`), and the generated
authentication templates call `flash()` (`packages/trailties/lib/generators/tse/authentication/templates/app/views/passwords/new.html.tse.tt`).
Reproduce in a plain app before fixing: the example boots from a `trails build` bundle.

## Acceptance criteria

- [ ] `flash()` and `notice()` resolve in a `.tse` template rendered by `ActionController::Base`.
- [ ] A test ports the Rails controller-helper assertion that covers it.
