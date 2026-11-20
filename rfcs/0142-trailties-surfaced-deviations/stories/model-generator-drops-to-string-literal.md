---
title: "Model generator drops the static toString literal"
status: in-progress
updated: 2026-11-19
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: trails#10385
claim: "2026-11-19T22:26:42Z"
assignee: "load-defaults-8-1-arm"
blocked-by: null
closed-reason: null
---

## Context

trails#10143 retired the `static toString()` Ruby-path literal from activejob and activesupport. Ruby renders `"#{klass}"` as `rb_mod_to_s` (`vendor/ruby/v3.3.11/object.c:1710-1742`), and the port of that is `rbModToS`. The trailties model generator still writes the literal into each generated app model (`packages/trailties/lib/generators/active-record/model/model-generator.ts:97`, tested in `packages/trailties/test/generators/model-generator.test.ts:654-790`). Rails' template `vendor/rails/v8.0.2/activerecord/lib/rails/generators/active_record/model/templates/model.rb.tt` writes no `to_s`. For a namespaced model (`Admin::User`), `rbModName` falls back to the JS class name, so without the literal it answers `User`.

## Acceptance criteria

- [ ] The generator emits no `static toString()`, matching `model.rb.tt`.
- [ ] A generated namespaced model's Ruby path comes through `rbModName` / `rbModToS`, for example via the constant seat on its namespace, not through a literal.
- [ ] The generator tests assert the template without the literal.
