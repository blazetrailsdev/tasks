---
title: "I18n is an ES module namespace, so assert_called_with(I18n, :translate) cannot stub it"
status: draft
updated: 2026-10-18
rfc: "0176-actionview-helpers"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/actionview/test/template/form_options_helper_i18n_test.rb:18-22` wraps `select` in `assert_called_with(I18n, :translate, ["helpers.select.prompt"], default: "Please select")`. In trails `I18n` (re-exported by `@blazetrails/activesupport`) is an ES module namespace object, so `stub` (`packages/activesupport/src/testing/method-call-assertions.ts`) cannot replace `I18n.translate`: assignment throws "Cannot set property translate of [object Module] which has only a getter". "select with prompt true translates prompt message" is parked as `it.skip` in `packages/actionview/src/template/form-options-helper-i18n.test.ts`.

## Acceptance criteria

- [ ] `assertCalledWith(I18n, "translate", ...)` works (I18n exposed as a stubbable object, or stub learns to reach a namespace's functions), and the parked test runs.
