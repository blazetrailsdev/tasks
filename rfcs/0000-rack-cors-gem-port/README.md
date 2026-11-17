---
rfc: "0000-rack-cors-gem-port"
title: "Port the rack-cors gem"
status: draft
created: 2026-11-17
updated: 2026-11-17
owner: "@deanmarano"
packages:
  - "rack-cors"
  - "trailties"
clusters:
  - rack-cors
---

<!-- Unnumbered until merge -->

# RFC — Port the rack-cors gem

## Summary

Port the `rack-cors` gem's `Rack::Cors` middleware as `@blazetrails/rack-cors`,
and make the generated `config/initializers/cors.ts` work with it when
uncommented. Rails 8's app template lists `# gem "rack-cors"`
(`vendor/rails/v8.0.2/railties/lib/rails/generators/rails/app/templates/Gemfile.tt:50`),
and API apps keep the `cors.rb` initializer
(`vendor/rails/v8.0.2/railties/lib/rails/generators/rails/app/app_generator.rb:554-558`).
Today that initializer has nothing to point at. Unlike rack-proxy, no other
ported gem depends on rack-cors, so this RFC stands alone rather than under
the `hotwire-via-vite` meta RFC.

## Motivation

trailties already generates
`packages/trailties/lib/generators/trails/app/templates/config/initializers/cors.ts.tt`,
which names `Rack.Cors` in commented-out code, but no package defines it. An
API app that uncomments the file fails to load. Of the gems in Rails' default
`Gemfile`, rack-cors is the only commented-in runtime middleware with no port
and no ruling.

## Design

- Vendor `cyu/rack-cors` at `v3.0.0`, the latest release on rubygems.org on
  2026-11-17. It depends on `rack >= 3.0.14` and `logger`.
- `packages/rack-cors` mirrors `lib/rack/cors.rb` and `lib/rack/cors/`
  (`resource.rb`, `resources.rb`, `result.rb`,
  `resources/cors_misconfiguration_error.rb`), about 500 lines of Ruby. The
  gem's unit tests (`test/unit/cors_test.rb`, 549 lines, 53 examples;
  `dsl_test.rb`, 70 lines, 4 examples) port under `packages/rack-cors/test/`
  on `@blazetrails/rack-test`.
- `Rack::Cors#initialize` and `#allow` (`lib/rack/cors.rb:29-64`) branch on
  `block.arity == 1`: they yield the receiver, or `instance_eval` the block.
  JS `Function.length` reads the same arity, so both arms port: a
  one-parameter function gets the receiver as its argument, and a
  zero-parameter function is called with it as `this`. The second arm is the
  shape `cors.ts.tt` already writes (`function () { this.allow(…) }`).
- `cors_test.rb#load_app` (`:67-79`) builds its app by `eval`-ing a `.ru`
  file inside a `Rack::Builder` block. Node cannot evaluate Ruby, so each
  `.ru` (`test.ru`, `insecure.ru`, `non_http.ru`) ports as a `.ts` module
  exporting a function that `load_app` calls with the builder as its
  argument, as the `Rack::Builder` port's constructor passes its block
  (`packages/rack/lib/builder.ts:30-39`). Mocha's `stubs` / `expects` port as
  `vi.fn` / `vi.spyOn`.
- `select_logger`'s `defined?(Rails) && Rails.logger` arm reads
  `TopLevel.Trails`, with a guard, as CLAUDE.md §
  "Call-time constant resolution" allows for a Rails `defined?`.

## Non-goals

- **CORS for Action Cable or Active Storage direct uploads.** Those are
  configured by the app, not by the gem.
- **`test/cors/`.** That is a browser test suite (mocha.js and
  CoffeeScript run from `runner.html`) against a live server, not a unit
  test. The unit suite covers the same headers through `Rack::MockRequest`.
- **Listing the package in a generated `package.json`.** `Gemfile.tt:50`
  only mentions the gem in a comment, and JSON has no comments. The generated
  `cors.ts` says to run `pnpm add @blazetrails/rack-cors` instead.

## Alternatives considered

- **An npm CORS package (`cors`) wrapped as Rack middleware.** It has a
  different configuration surface, so a Rails dev's `cors.rb` would not carry
  over. Rejected under "Fidelity is the job".

## Rollout

1. `rack-cors-gem-port`: vendor the gem, port `lib/`, and port
   `dsl_test.rb`.
2. `rack-cors-unit-test-suite`: port `cors_test.rb` and its `.ru` configs.
3. `rack-cors-app-generator-initializer`: the generated `cors.ts`'s
   commented block imports `Rack.Cors` from `@blazetrails/rack-cors`.

Stories 2 and 3 both depend only on story 1.

## Verification

- `pnpm parity:api rack-cors` reports no missing methods, and
  `pnpm parity:test rack-cors` matches all 57 Rails examples.
- A generated `--api` app with `cors.ts` uncommented boots, and a preflight
  `OPTIONS` request gets `access-control-allow-origin`.

## Open questions

None.

## Changelog

- 2026-11-17: initial RFC.
