---
title: "Turbo dummy serves Rails' application.css in system tests"
status: done
updated: 2026-11-19
rfc: "0238-turbo-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 15
priority: null
pr: trails#10369
claim: "2026-11-19T18:12:55Z"
assignee: "turbo-dummy-application-stylesheet"
blocked-by: null
closed-reason: null
---

## Context

The turbo dummy layout (`packages/turbo/test/dummy/app/views/layouts/application.html.tse`)
links `stylesheetLinkTag("application")`, as Rails' does
(`vendor/turbo-rails/v2.0.23/test/dummy/app/views/layouts/application.html.erb`), but the
dummy has no `app/assets/stylesheets/application.css`
(Rails: `vendor/turbo-rails/v2.0.23/test/dummy/app/assets/stylesheets/application.css`).
Every system-test page load (`packages/turbo/test/system/form-submissions.system.test.ts`)
logs `ActionController::RoutingError: No route matches [GET] "/stylesheets/application.css"`.

## Acceptance criteria

- The dummy carries Rails' `application.css`, served under the Vite system-test server, and
  system-test runs log no stylesheet RoutingError.
