---
title: "AppGenerator renders config/routes.ts from a template"
status: in-progress
updated: 2026-11-02
rfc: "0212-trailties-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: trails#9635
claim: "2026-11-02T17:56:45Z"
assignee: "rake-command-printing-commands-and-invoke-rake"
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/railties/test/generators/generators_test_helper.rb:65-73` reads `app/templates/config/routes.rb.tt`. trails' `AppGenerator` writes `config/routes.ts` from an inline string (`packages/trailties/src/generators/rails/app/app-generator.ts:869`), so `generators-test-helper.ts` carries a copy of the literal.

## Acceptance criteria

- `AppGenerator` renders `config/routes.ts` from a `routes.ts.tt` template, and `copyRoutes` evaluates that template, leaving no second copy.
