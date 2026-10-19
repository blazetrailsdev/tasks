---
title: "controller-delegates-mix-properties-and-methods"
status: closed
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
closed-reason: 'Verified against trails origin/main (6ccf009f20) during 0141 refine 2026-10-19: installControllerDelegates and its CONVERGEABLE receipt are gone; ControllerHelper now uses delegate.call(...,{to:"controller"}) (actionview helpers/controller-helper.ts:68-81); git grep receipt name: no hits'
---

## Context

`ActionView::Helpers::ControllerHelper` is `delegate(*CONTROLLER_DELEGATES, to: :controller)`
(`vendor/rails/v8.0.2/actionview/lib/action_view/helpers/controller_helper.rb:13-17`): ten
zero-argument readers, each forwarded as a method call.

trails' `installControllerDelegates`
(`packages/actionview/src/helpers/controller-helper.ts`) installs one getter per name that reads
`controller[name]`. The controller side is not uniform: `params`, `session`, `response`, `headers`
and `actionName` are accessor properties (`packages/actionpack/src/action-controller/metal.ts:147-170,286`,
`abstract-controller/base.ts:67`), while `controllerName` (`metal.ts:238`), `controllerPath`
(`abstract-controller/base.ts:229`) and `cookies` (`action-controller/metal/cookies.ts:14`) are
methods. So the getter carries `typeof value === "function" ? value.bind(controller) : value`,
an arm Rails' `delegate` does not have, receipted
`@inventedArm if — CONVERGEABLE controller-delegates-mix-properties-and-methods`. Without it a
template's `<%= controllerName() %>` raised `this.constructor.controllerName is not a function`
(trails#8803, `new-base/render.test.ts` "The controller_name is accessible in the view").

A zero-arg Ruby reader ports as an accessor property (CLAUDE.md, "Generated attribute readers
are properties"), so the three methods are the deviation.

## Acceptance criteria

- [ ] `controllerName`, `controllerPath` and `cookies` on a controller instance are accessor
      properties, with every call site updated (`ViewPaths#localPrefixes`, `layouts.ts`,
      `params-wrapper.ts`, `rate-limiting.ts`, templates).
- [ ] `installControllerDelegates` reads `controller[name]` with no `typeof` arm, and its
      `@inventedArm` receipt is deleted.
- [ ] `render.test.ts`'s `access-controller-name` fixture reads `<%= controllerName %>`, as Rails'
      `<%= controller_name %>` does.
