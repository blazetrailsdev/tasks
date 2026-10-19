---
title: "base-assign-collides-with-controller-delegate-accessors"
status: ready
updated: 2026-10-19
rfc: "0141-actionpack-surfaced-deviations"
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

`ActionView::Base#assign` (`vendor/rails/v8.0.2/actionview/lib/action_view/base.rb:263-266`) seats each assign as an ivar (`instance_variable_set("@#{key}", value)`), so `@response` and the `response` controller delegate (`helpers/controller_helper.rb:11-13`) are separate. trails' `Base#assign` (`packages/actionview/src/base.ts:265-270`) writes `this[key] = value`, and `installControllerDelegates` (`packages/actionview/src/helpers/controller-helper.ts:79-91`) puts a getter-only `response` accessor on the prototype, so `new DebugView({ response })` throws `TypeError: Cannot set property response of #<Base> which has only a getter`. The same collision hits every `CONTROLLER_DELEGATES` name (`params`, `session`, `cookies`, `headers`, `flash`, ...). As a result, `defined?(@response)` in `_request_and_response.{html,text}.tse` (`rbObjIvarDefined(this, "@response")`) can never be true.

## Acceptance criteria

- An assign named after a controller delegate is seated as its ivar without throwing, and the delegate still answers the controller's value.
- `new DebugView({ response })` renders the Response headers section of `rescues/_request_and_response` with the headers.
