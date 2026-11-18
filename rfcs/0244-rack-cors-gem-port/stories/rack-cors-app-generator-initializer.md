---
title: "Generated cors.ts initializer loads @blazetrails/rack-cors"
status: ready
updated: 2026-11-18
rfc: "0244-rack-cors-gem-port"
cluster: rack-cors
packages: [trailties]
deps: [rack-cors-gem-port]
deps-rfc: []
est-loc: 100
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/trailties/lib/generators/trails/app/templates/config/initializers/cors.ts.tt`
mirrors `vendor/rails/v8.0.2/railties/lib/rails/generators/rails/app/templates/config/initializers/cors.rb.tt`
and names `Rack.Cors` in commented-out code with no import, so uncommenting it
fails. `AppGenerator` keeps the file only for `--api` apps
(`packages/trailties/lib/generators/trails/app/app-generator.ts:326-359`;
Rails `app_generator.rb:554-558`). Rails' `Gemfile.tt:50` lists the gem
commented out.

## Acceptance criteria

- The template's commented block includes the `@blazetrails/rack-cors` import,
  so uncommenting the whole block is enough.
- The block's comment says to run `pnpm add @blazetrails/rack-cors`, where
  Rails' `Gemfile.tt:50` comments out the gem. The generated `package.json`
  does not list it, as it does not list bcrypt (`Gemfile.tt:9`): JSON has no
  comment to hold it.
- An `api-app-generator.test.ts` case asserts the import line in the
  generated template.
- A new `packages/trailties/test/boot-app-cors.trails.test.ts` boots the
  existing `test/fixtures/boot-app` fixture the way
  `boot-app-api-controller.trails.test.ts` does (import
  `config/application.js`, `setRoot`, `Trails.initialize()`, then
  `Trails.application.call(env)`). The fixture gains a
  `config/initializers/cors.ts` holding the template's block uncommented.
  The test sends an `OPTIONS` preflight with `HTTP_ORIGIN` and
  `HTTP_ACCESS_CONTROL_REQUEST_METHOD` and asserts
  `access-control-allow-origin`. It does not boot a freshly generated app:
  no harness does that per test, and the generator case already pins the
  template text.
