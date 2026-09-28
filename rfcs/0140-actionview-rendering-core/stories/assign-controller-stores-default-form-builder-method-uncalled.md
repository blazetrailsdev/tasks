---
title: "assign-controller-stores-default-form-builder-method-uncalled"
status: draft
updated: 2026-09-28
rfc: "0140-actionview-rendering-core"
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

Rails' `ActionView::Helpers::ControllerHelper#assign_controller`
(`vendor/rails/v8.0.2/actionview/lib/action_view/helpers/controller_helper.rb:24`)
**calls** the controller's reader:
`@_default_form_builder = controller.default_form_builder if controller.respond_to?(:default_form_builder)`.

trails' `assignController` (`packages/actionview/src/helpers/controller-helper.ts:54-55`)
reads the property without calling it:
`this._defaultFormBuilder = controller.defaultFormBuilder;`. On an
`ActionController::Base` controller that is the instance method
`defaultFormBuilder()` (`packages/actionpack/src/action-controller/base.ts:579`),
so `_defaultFormBuilder` holds a function, `defaultFormBuilderClass`
(`form-helper.ts:166-172`) returns it, and `instantiateBuilder` (`form-helper.ts:162`)
raises `TypeError: builder is not a constructor`. Every `formWith({ model })`
in a controller-rendered view fails, including the scaffold's `_form.html.tse`.

Found re-running the root README quickstart (PR #8195) on `main` at `c19bfc0aee`.
The respond_to? guard should use `rbObjRespondTo`.

## Acceptance criteria

- [ ] `assignController` calls `controller.defaultFormBuilder()` behind a
      `respond_to?` guard, per `controller_helper.rb:24`.
- [ ] A test renders `formWith({ model })` from a real `ActionController::Base`
      action and gets the default `FormBuilder` (red on the current code).
