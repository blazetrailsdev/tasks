---
title: "ActionMailer::Base loads when first referenced, not when its railtie is imported"
status: in-progress
updated: 2026-11-06
rfc: "0204-actionmailer-and-mail-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: trails#9805
claim: "2026-11-06T21:29:49Z"
assignee: "action-mailer-base-loads-when-first-referenced-not-with-its-railtie"
blocked-by: null
closed-reason: null
---

## Context

Rails runs `action_mailer.set_configs` before `bootstrap_hook`: its
`action_mailer.set_autoload_paths` initializer is `before: :set_autoload_paths`
and is auto-chained `after` `set_configs`
(`vendor/rails/v8.0.2/actionmailer/lib/action_mailer/railtie.rb`). That is
harmless in Rails because the `on_load(:action_mailer)` body, which calls
`app.routes`, runs only when `ActionMailer::Base` autoloads, after boot.

`packages/trailties/src/trailties/action-mailer.ts` value-imports `Base`
(through `@blazetrails/actionmailer`), `TestHelper`
(`actionmailer/src/test-helper.ts:15`) and `ClearTestDeliveries`
(`actionmailer/src/test-case.ts:16`), and each of those imports `./base.js`. So
`Base` is loaded when the railtie is, `runLoadHooks("action_mailer", Base)`
(`actionmailer/src/base.ts:639`) has already fired, and `onLoad("action_mailer")`
runs its body inside `set_configs`. `app.routes()` then memoizes a plain
`RouteSet` before the app's `make_routes_lazy` sets `routeSetClass` to
`LazyRouteSet` (`trailties/src/engine.ts:451-453`), and the finisher's
`set_routes_reloader_hook` loads routes eagerly at boot. Found by trails#9801:
with the railtie loaded, `application.test.ts` › "boots the app through the
initializer chain and serves a controller action" sees
`routesReloader().loaded` true.

Ruling: the repo owner chose this shape on 2026-11-06 over moving the
initializer or accepting eager routes.

## Acceptance criteria

- Importing `@blazetrails/trailties/trailties/action-mailer` does not evaluate
  `actionmailer/src/base.ts`: the railtie imports `ActionMailer` from
  `@blazetrails/actionmailer/namespaces`, `deprecator` from
  `@blazetrails/actionmailer/deprecator`, and `Base` as a type only.
- `test-helper.ts` and `test-case.ts` reach `Base` at call time through
  `ActionMailer.Base`, as Rails' `ActionMailer::Base` / `Base` constant
  references do (`test_helper.rb:261`, `test_case.rb:26-27`), and import it as
  a type only.
- A test fails before the change: after importing the railtie, an
  `onLoad("action_mailer")` hook has not run.
