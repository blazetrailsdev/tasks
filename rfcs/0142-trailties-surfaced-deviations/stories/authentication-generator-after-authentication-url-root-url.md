---
title: 'Authentication generator: afterAuthenticationUrl falls back to "/" instead of root_url'
status: draft
updated: 2026-11-17
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' authentication concern template
(`vendor/rails/v8.0.2/railties/lib/rails/generators/rails/authentication/templates/app/controllers/concerns/authentication.rb.tt:37-39`)
is `session.delete(:return_to_after_authenticating) || root_url`.

trails' `packages/trailties/lib/generators/trails/authentication/templates/app/controllers/concerns/authentication.ts.tt`
(`afterAuthenticationUrl`) falls back to the hand-built string `"/"`. trails#10232 converged
every `redirectTo` in these templates onto route helpers, but this fallback was outside that story.

## Converged shape

`afterAuthenticationUrl` returns the deleted session value, or `this.rootUrl()`, the way Rails
does. The strict type-check test's route augmentation gains `rootUrl`.

## Acceptance criteria

- No `"/"` literal remains in `afterAuthenticationUrl`; it calls `this.rootUrl()`.
- The snapshot in `authentication-generator.test.ts` and the strict type-check test are updated.
