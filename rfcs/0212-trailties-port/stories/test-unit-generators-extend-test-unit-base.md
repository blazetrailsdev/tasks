---
title: "test_unit generators extend TestUnit::Generators::Base"
status: draft
updated: 2026-11-06
rfc: "0212-trailties-port"
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

Every Rails test_unit generator inherits `TestUnit::Generators::Base < Rails::Generators::NamedBase` (`vendor/rails/v8.0.2/railties/lib/rails/generators/test_unit.rb:5-8`), e.g. `test_unit/job/job_generator.rb:7`, `test_unit/helper/helper_generator.rb:7`, `test_unit/mailer/mailer_generator.rb:7`. trails#9793 added `packages/trailties/src/generators/test-unit.ts` (`Base`) and moved only `test-unit/generator/generator-generator.ts` onto it; the rest of `packages/trailties/src/generators/test-unit/*/*-generator.ts` still extend `NamedBase` directly.

## Acceptance criteria

- Every test_unit generator whose Rails class extends `Base` extends `Base` from `generators/test-unit.ts`.
- Generator tests for those generators stay green.
