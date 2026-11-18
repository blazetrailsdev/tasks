---
title: "Port the rack-cors gem as @blazetrails/rack-cors"
status: in-progress
updated: 2026-11-18
rfc: "0244-rack-cors-gem-port"
cluster: rack-cors
packages: [rack-cors]
deps: []
deps-rfc: []
est-loc: 550
priority: null
pr: trails#10291
claim: "2026-11-18T12:36:41Z"
assignee: "rack-cors-gem-port"
blocked-by: null
closed-reason: null
---

## Context

Rails' app template lists `# gem "rack-cors"`
(`vendor/rails/v8.0.2/railties/lib/rails/generators/rails/app/templates/Gemfile.tt:50`).
The gem at v3.0.0 is `lib/rack/cors.rb` (219 lines) plus `lib/rack/cors/`
`resource.rb` (142), `resources.rb` (62), `result.rb` (63) and
`resources/cors_misconfiguration_error.rb` (14). Its runtime dependencies are
`rack >= 3.0.14` and `logger`. No trails package ports it, and
`vendor/sources.ts` does not vendor it.

## Acceptance criteria

- `vendor/sources.ts` vendors `https://github.com/cyu/rack-cors.git` at
  `v3.0.0`, with `lib/rack` and `test` paths, as the rack-proxy entry does.
- `packages/rack-cors` ports every file under `lib/rack/cors*`, with Rails
  names and control flow. `Rack::Cors::Resources::CorsMisconfigurationError`
  is the same error class with the same message.
- `Rack::Cors#initialize` and `#allow` (`lib/rack/cors.rb:29-64`) port both
  `block.arity == 1` arms, read through `Function.length`: a one-parameter
  block receives the receiver, a zero-parameter block runs with it as
  `this`.
- `select_logger`'s `Rails.logger` arm reads `TopLevel.Trails` behind a guard
  that mirrors `defined?(Rails)`.
- `test/unit/dsl_test.rb` (4 examples) ports onto `@blazetrails/rack-test`,
  and `pnpm parity:api rack-cors` reports no missing methods.
  `cors_test.rb` is `rack-cors-unit-test-suite`.
- The package is registered in `ci.yml` and the parity guard fixtures.
