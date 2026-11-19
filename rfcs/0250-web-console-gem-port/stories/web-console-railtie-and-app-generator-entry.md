---
title: "Port WebConsole::Railtie and add web-console to the generated app"
status: draft
updated: 2026-11-19
rfc: "0250-web-console-gem-port"
cluster: port
packages: [web-console, trailties]
deps: [web-console-middleware-interceptor-extensions]
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`lib/web_console/railtie.rb` (config, middleware insertion, the inspector
session in development). The app generator adds `@blazetrails/web-console` to
`package.json` `devDependencies`, removed by `--skip-dev-gems`
(`vendor/rails/v8.0.2/railties/lib/rails/generators/app_base.rb:95`), per the
trailties Gemfile → package.json mapping.

## Acceptance criteria

- [ ] The railtie is ported.
- [ ] `vendor/rails/v8.0.2/railties/test/generators/app_generator_test.rb`'s
      `test_web_console` (`:789`) and `test_skip_dev_gems` (`:1032`), and
      `api_app_generator_test.rb:44`'s web-console assertion, are ported and pass.
- [ ] A generated app shows a working console when an action raises.
