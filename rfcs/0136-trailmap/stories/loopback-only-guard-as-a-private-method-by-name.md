---
title: "LoopbackOnly: register requireLoopback by name as a private method once trails supports both"
status: blocked
updated: 2026-10-29
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: "2026-10-29T12:51:28Z"
assignee: "loopback-only-guard-as-a-private-method-by-name"
blocked-by: "trails story ts-private-controller-method-is-an-action-method (0141) not landed; ownPublicMethodNames still counts TS-private methods"
closed-reason: null
---

`app/controllers/concerns/loopback-only.ts` registers its guard as a `beforeAction` block that calls a module function, and on purpose does not put `requireLoopback` on the controller. trails' `AbstractController.actionMethods` (`packages/actionpack/src/abstract-controller/base.ts`, `ownPublicMethodNames`) counts every method on the prototype that doesn't start with `_`. Anything `include()` adds, or anything marked TypeScript-`private`, becomes an action. Before the change in #82, `ApiController.actionMethods()` returned `renderServerError, requireLoopback`. In Rails the concern's helper sits under `private` (abstract_controller/base.rb:77-107), and the guard is `before_action :require_loopback`.

This is a workaround for two trails stories:

- `ts-private-controller-method-is-an-action-method` (0141)
- `before-action-does-not-accept-a-method-name` (0141)

After both land and are vendored, give the concern a private `requireLoopback`, register it with `beforeAction("requireLoopback")`, and delete the comment explaining the workaround. Keep the test in `test/controllers/loopback-only.test.ts` that checks `actionMethods()` excludes it. `renderServerError` in `ApiController`, and the other TS-`private` helpers, stop being actions at the same time.
