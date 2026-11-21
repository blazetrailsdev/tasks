---
title: "bootstrap-initialize-error-reporter"
status: draft
updated: 2026-11-21
rfc: "0142-trailties-surfaced-deviations"
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

Rails' `Bootstrap` has `initializer :initialize_error_reporter, group: :all`
(`vendor/rails/v8.0.2/railties/lib/rails/application/bootstrap.rb:68-74`): with
`config.consider_all_requests_local` it sets `Rails.error.debug_mode = true`, else
`Rails.error.logger = Rails.logger`.
`packages/trailties/lib/application/bootstrap.ts` has no such initializer, so
`Trails.error.debugMode` is always false (`ErrorReporter#unexpected` never raises
in dev/test) and `logger` stays null (a raising subscriber propagates instead of
being logged). The Error Reporting guide (`packages/website/docs/guides/error-reporting.md`)
currently tells readers to set `debugMode` by hand.

## Acceptance criteria

- [ ] `Bootstrap.initializer("initialize_error_reporter", { group: "all" }, ...)` ported line for line from `bootstrap.rb:68-74`.
- [ ] Ported railties test(s) for it pass.
- [ ] The guide's manual `debugMode` note is removed.
