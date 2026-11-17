---
rfc: "0000-rack-cors-gem-port"
title: "Port the rack-cors gem"
status: draft
created: 2026-11-17
updated: 2026-11-17
owner: "@deanmarano"
packages:
  - "rack-cors"
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
Today that initializer has nothing to point at.

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
  gem's `test/` tree ports under `packages/rack-cors/test/` and runs on
  `@blazetrails/rack-test`.
- The config DSL (`allow do … end`, `origins`, `resource`) uses the settled
  instance-eval block idiom, as the existing `cors.ts.tt` comment already
  writes it (`function () { this.allow(…) }`).
- `select_logger`'s `defined?(Rails) && Rails.logger` arm reads
  `TopLevel.Trails`, with a guard, as CLAUDE.md §
  "Call-time constant resolution" allows for a Rails `defined?`.

## Non-goals

- **CORS for Action Cable or Active Storage direct uploads.** Those are
  configured by the app, not by the gem.

## Alternatives considered

- **An npm CORS package (`cors`) wrapped as Rack middleware.** It has a
  different configuration surface, so a Rails dev's `cors.rb` would not carry
  over. Rejected under "Fidelity is the job".

## Rollout

1. `rack-cors-gem-port`: vendor, port `lib/`, and port the gem's tests.
2. `rack-cors-app-generator-initializer`: the generated `cors.ts` imports
   `Rack.Cors` from `@blazetrails/rack-cors`, and the generated app's
   `package.json` lists the package commented out, as the `Gemfile` comments
   out the gem.

## Verification

- `pnpm parity:api rack-cors` and `pnpm parity:test rack-cors` report no
  missing methods or tests.
- A generated `--api` app with `cors.ts` uncommented boots, and a preflight
  `OPTIONS` request gets `access-control-allow-origin`.

## Open questions

None.

## Changelog

- 2026-11-17: initial RFC.
