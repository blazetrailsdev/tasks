---
title: "railtie-configuration-app-generators"
status: draft
updated: 2026-09-04
rfc: "0104-twitter-app-full-stack-integration"
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
closed-reason: null
---

## Context

Split out of `railtie-configuration-app-middleware-and-generators-stubs`, whose
acceptance criteria explicitly allow it ("`appGenerators()` returns the
generators config, or is split out with its own story if that surface is not yet
ported"). That story shipped the `app_middleware` half — `MiddlewareStackProxy`
is now ported at `packages/trailties/src/configuration.ts`, mirroring
`railties/lib/rails/configuration.rb:46-99`, and
`Railtie::Configuration#app_middleware` (`railtie/configuration.rb:39-41`)
returns one.

`Railtie::Configuration#app_generators` (`railtie/configuration.rb:44-49`) still
returns `undefined` in `packages/trailties/src/trailtie/configuration.ts`:

```ruby
def app_generators
  @@app_generators ||= Rails::Configuration::Generators.new
  yield(@@app_generators) if block_given?
  @@app_generators
end
```

It is blocked on `Rails::Configuration::Generators`
(`railties/lib/rails/configuration.rb:101-169`), which is not ported. That class
is not a data bag — it carries `initialize_copy`'s `deep_dup` semantics, the
default-block Hashes (`Hash.new { |h, k| h[k] = {} }`) behind `@aliases` and
`@options`, `hide_namespace`, `after_generate`, and a `method_missing`
(`:143-166`) whose two-arm namespace/configuration parsing is the whole surface
callers use (`config.generators do |g| g.orm :active_record end`).

`packages/trailties/src/engine/configuration.ts` currently has a stand-in
`generators(block?)` returning a bare `{ templates: [] }`, which
`Application#ensureGeneratorTemplatesAdded` reads.

Note `apply_rubocop_autocorrect_after_generate!` (`:129-139`) shells out via
`system(RbConfig.ruby, "bin/rubocop", ...)`. trails' hard rules forbid
`process.*`, so that method needs its own decision — it is not a mechanical
port.

## Acceptance criteria

- [ ] `Rails::Configuration::Generators` is ported to
      `packages/trailties/src/configuration.ts` beside `MiddlewareStackProxy`,
      in Rails declaration order, at its Rails member names.
- [ ] `Configuration#appGenerators()` returns it, accepting the optional block
      Rails yields to (`railtie/configuration.rb:47`).
- [ ] `EngineConfiguration#generators` returns a real `Generators` rather than
      the `{ templates: [] }` stand-in, and
      `Application#ensureGeneratorTemplatesAdded` reads `templates` off it.
- [ ] No stub returning `undefined` remains on `Railtie::Configuration`.
- [ ] `apply_rubocop_autocorrect_after_generate!` is either ported or its
      omission is recorded with a receipt naming the `process.*` hard rule.
