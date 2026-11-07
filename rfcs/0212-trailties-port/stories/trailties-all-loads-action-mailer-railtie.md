---
title: "trailties-all-loads-action-mailer-railtie"
status: done
updated: 2026-11-07
rfc: "0212-trailties-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#9801
claim: "2026-11-07T22:15:20Z"
assignee: "trailties-all-loads-action-mailer-railtie"
blocked-by: null
closed-reason: null
---

## Context

`packages/trailties/src/all.ts` lists `action_mailer/railtie` but has no
load-path entry for it, so `import "@blazetrails/trailties/all"` never loads the
ActionMailer trailtie. Rails' `rails/all.rb` requires it.

Adding the entry (tried on trails#9806) breaks
`application.test.ts` "boots the app through the initializer chain and serves a
controller action": routes are loaded during `initialize!`. Cause:
`action_mailer.set_configs` (`packages/trailties/src/trailties/action-mailer.ts:72-80`)
registers `onLoad("action_mailer", …)`, which calls `app.routes()`. In Rails the
hook waits until `ActionMailer::Base` is autoloaded
(`vendor/rails/v8.0.2/actionmailer/lib/action_mailer/railtie.rb:44-52`), after
`make_routes_lazy` (`vendor/rails/v8.0.2/railties/lib/rails/engine.rb:591-593`) has set
`config.route_set_class = LazyRouteSet`. In trails `Base` is already loaded, so
the hook runs at once, `Engine#routes` memoizes a plain `RouteSet`, and
`set_routes_reloader_hook` (`application/finisher.ts:233`) then loads the
routes eagerly.

## Acceptance criteria

- `all.ts` loads `action_mailer/railtie`.
- The `action_mailer` load hook runs no earlier than Rails', so `app.routes`
  is still a `LazyRouteSet` in development and the boot-app test keeps
  `routesReloader().loaded === false` after initialize.
