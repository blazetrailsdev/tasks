---
title: "controller-helper-respond-to-delegates"
status: ready
updated: 2026-09-30
rfc: "0140-actionview-rendering-core"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 8
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ControllerHelperTest#test_respond_to`
(`vendor/rails/v8.0.2/actionview/test/template/controller_helper_test.rb:24-35`) is the one
test of that file not ported to `packages/actionview/src/template/controller-helper.test.ts`.
It needs `ControllerHelper#respond_to?`
(`actionview/lib/action_view/helpers/controller_helper.rb:36-39`), which answers
`controller.respond_to?(name)` for a `CONTROLLER_DELEGATES` name. trails has no
`isRespondTo` on the view, so `rbObjRespondTo(view, "params")` answers true from the
delegate accessor `installControllerDelegates` defines, whatever the controller answers.

## Acceptance criteria

- The view answers `isRespondTo` per `controller_helper.rb:36-39`.
- `test_respond_to` is ported under `ControllerHelperTest`.
