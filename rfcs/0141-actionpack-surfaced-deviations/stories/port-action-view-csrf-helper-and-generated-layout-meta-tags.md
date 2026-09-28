---
title: "port-action-view-csrf-helper-and-generated-layout-meta-tags"
status: draft
updated: 2026-09-28
rfc: "0141-actionpack-surfaced-deviations"
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

`ActionView::Helpers::CsrfHelper#csrf_meta_tags` / `#csrf_meta_tag`
(`vendor/rails/v8.0.2/actionview/lib/action_view/helpers/csrf_helper.rb:22-36`)
has no trails port: nothing under `packages/actionview/src/helpers/` defines
`csrfMetaTags`.

Rails' generated layout emits it
(`vendor/rails/v8.0.2/railties/lib/rails/generators/rails/app/templates/app/views/layouts/application.html.erb.tt:8`);
trails' generated layout (`packages/trailties/src/generators/app-generator.ts`,
the `<head>` block near `:1074`) does not.

Found while scoping `port-action-controller-request-forgery-protection-initializer`:
once `protect_from_forgery with: :exception` runs by default, a generated app
also needs the meta tags (Rails UJS / Turbo read them for non-form requests).
The helper reads `protect_against_forgery?`, `request_forgery_protection_token`
and `form_authenticity_token`, which reach the view through the controller's
`helper_method` wiring from the RequestForgeryProtection concern
(`action_controller/metal/request_forgery_protection.rb`, its `included` block);
that wiring is `delete-invented-action-dispatch-respond-to-and-csrf-modules`.

## Acceptance criteria

- `csrf_helper.rb` is ported at `packages/actionview/src/helpers/csrf-helper.ts`
  (`csrfMetaTags`, `csrfMetaTag` alias), included in the helpers.
- The generated `application.html.tse` layout emits `<%= csrfMetaTags() %>` in
  `<head>`, per `application.html.erb.tt:8`.
- Rails' `csrf_helper` tests (`actionview/test/template/csrf_helper_test.rb`,
  if present, else the `csrf_meta_tags` cases in
  `actionpack/test/controller/request_forgery_protection_test.rb`) are ported.
