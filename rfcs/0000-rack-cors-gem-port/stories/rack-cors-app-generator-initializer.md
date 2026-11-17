---
title: "Generated cors.ts initializer loads @blazetrails/rack-cors"
status: draft
updated: 2026-11-17
rfc: "0000-rack-cors-gem-port"
cluster: rack-cors
packages: [trailties]
deps: [rack-cors-gem-port]
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
- The generated app's `package.json` lists `@blazetrails/rack-cors` the way the
  generated app handles `Gemfile.tt`'s other commented gems (bcrypt,
  image_processing). If there is no such mechanism yet, the story uses the
  same shape as bcrypt's and says so.
- An `api-app-generator.test.ts` case asserts the import line. A
  trails-only test boots a generated `--api` app with the block uncommented
  and checks a preflight `OPTIONS` response for
  `access-control-allow-origin`.
