---
title: "test-unit-controller-template-emits-test-class"
status: in-progress
updated: 2026-11-09
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: [trailties]
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: trails#9934
claim: "2026-11-09T21:05:40Z"
assignee: "trailties-mailer-previews-test-port-remaining"
blocked-by: null
closed-reason: null
---

## Context

`packages/trailties/src/generators/test-unit/controller/templates/` emits a Vitest `describe("AccountsController")`
with no test class, where Rails' `functional_test.rb.tt` emits `class AccountsControllerTest < ActionDispatch::IntegrationTest`,
asserted at `vendor/rails/v8.0.2/railties/test/generators/resource_generator_test.rb:47`.
`resource-generator.test.ts` asserts the `describe` until this converges. The scaffold template
(`test-unit/scaffold/templates.ts:19`) already emits the class form.

## Acceptance criteria

- The controller test template emits `class <Name>ControllerTest extends IntegrationTest`.
- "resource controller with pluralized class name" asserts that class.
