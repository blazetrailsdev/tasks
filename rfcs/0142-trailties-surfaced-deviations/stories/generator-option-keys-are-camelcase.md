---
title: "trailties: per-generator option keys are camelCase in defaultForOption"
status: draft
updated: 2026-11-21
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Base.default_for_option` keys `Rails::Generators.options` by `generator_name.to_sym` (`vendor/rails/v8.0.2/railties/lib/rails/generators/base.rb`, `default_for_option`). trails' `Base.generatorName` (`packages/trailties/lib/generators/base.ts:418-423`) answers an underscored name (`with_options`), so `Generators.options()` must be keyed snake_case for a per-generator default (the `developer options are overwritten by user options` port in `packages/trailties/test/generators.test.ts` writes `options()["with_options"]`), while every other options key is camelCase (`trails`, `mailer`, `templateEngine`). Per CLAUDE.md "Casing is translated", option keys are camelCase.

## Acceptance criteria

- [ ] Per-generator option and alias lookups in `defaultForOption` use the camelCase key (`withOptions`), and the test writes `Generators.options()["withOptions"]`.
- [ ] Existing generator tests stay green.
