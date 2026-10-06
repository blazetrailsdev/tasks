---
title: "actionview: csrf_meta_tags is not ported, and a view calling it compiles then 500s"
status: in-progress
updated: 2026-10-06
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: ["actionview"]
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: trails#8587
claim: "2026-10-06T16:54:46Z"
assignee: "port-action-view-csrf-helper"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by trailmap#40 (trails pin `68f75280bd`). A page that POSTs with `fetch` needs the CSRF
token, and Rails puts it in the layout with `csrf_meta_tags`
(`vendor/rails/v8.0.2/actionview/lib/action_view/helpers/csrf_helper.rb`, `csrf_meta_tags` and its
alias `csrf_meta_tag`), which emits `<meta name="csrf-param">` and `<meta name="csrf-token">` when
`protect_against_forgery?`.

trails has the controller half: forgery protection is on and enforced (a tokenless POST raises
`ActionController::InvalidAuthenticityToken`), and `formAuthenticityToken`
(`packages/actionpack/src/action-controller/metal/request-forgery-protection.ts`) is public. It has
no `packages/actionview/src/helpers/csrf-helper.ts`: calling `csrfMetaTags()` in a `.tse` layout
compiles under `trails-tsc-views` and then fails the render with a 500.

The application workaround, which is the finding: trailmap's `DashboardController` calls
`this.formAuthenticityToken()` and passes it to the view as a local, which writes it into a `data-`
attribute for the page's script.

Two gaps, then: the helper is missing, and `trails-tsc-views` did not reject a call to a helper
that does not exist.

## Expected shape

`ActionView::Helpers::CsrfHelper` ported, reachable from every view as `csrfMetaTags()`, reading
`protect_against_forgery?`, `request_forgery_protection_token` and `form_authenticity_token`
through the controller as Rails' helper does.

## Acceptance criteria

- [ ] `csrf_meta_tags` and `csrf_meta_tag` are ported with their Rails tests (`actionview/test/template/csrf_helper_test.rb`).
- [ ] A view calling a helper that does not exist fails `trails-tsc-views build`, or a story says why it cannot.
- [ ] trailmap's layout can use `csrfMetaTags()` and drop the `csrfToken` local.
