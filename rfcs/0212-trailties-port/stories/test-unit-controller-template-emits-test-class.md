---
title: "test-unit-controller-template-emits-test-class"
status: ready
updated: 2026-11-02
rfc: "0212-trailties-port"
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

`packages/trailties/src/generators/test-unit/controller/templates/` emits a Vitest `describe("AccountsController")`
with no test class, where Rails' `functional_test.rb.tt` emits `class AccountsControllerTest < ActionDispatch::IntegrationTest`,
asserted at `vendor/rails/v8.0.2/railties/test/generators/resource_generator_test.rb:47`.
`resource-generator.test.ts` asserts the `describe` until this converges. The scaffold template
(`test-unit/scaffold/templates.ts:19`) already emits the class form.

## Acceptance criteria

- The controller test template emits `class <Name>ControllerTest extends IntegrationTest`.
- "resource controller with pluralized class name" asserts that class.
