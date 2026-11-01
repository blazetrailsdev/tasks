---
title: "abstract_unit includes its helpers on ActiveSupport::TestCase"
status: draft
updated: 2026-11-01
rfc: "0212-trailties-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/railties/test/isolation/abstract_unit.rb:591-606` reopens `ActiveSupport::TestCase` to include `TestHelpers::Paths`, `Rack`, `Generation`, `Reload` and defines `with_env`. `packages/trailties/src/test-helpers/isolation/abstract-unit.ts` is also the vitest `globalSetup`, and importing `TestCase` into vitest's main process ends it silently, so each test class includes the modules itself (`packages/trailties/src/isolation/test-helpers.test.ts`).

## Acceptance criteria

- `globalSetup` lives where it does not load `abstract-unit.ts`'s `TestCase` reopening, with the template path still from `Paths#appTemplatePath`.
- `abstract-unit.ts` does `include(TestCase, ...)` as Rails does, and test classes drop their own includes.
