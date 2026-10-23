---
title: "configFor drops config_for's Pathname argument arm"
status: ready
updated: 2026-10-08
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: 5
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#8112 ported `Rails::Application#config_for` (`railties/lib/rails/application.rb:288-313`) as `Application#configFor` in `packages/trailties/src/application.ts`. It takes only a `name: string` and always resolves `${paths["config"].existent.first}/${name}.{ts,js}`.

Rails' first line branches on the argument type:

```ruby
yaml = name.is_a?(Pathname) ? name : Pathname.new("#{paths["config"].existent.first}/#{name}.yml")
```

A `Pathname` is used as-is, so an app can read a config file from outside `config/`. The Rails test `config_for uses the Pathname object if it is provided` (`railties/test/application/configuration_test.rb:2541`) covers this. It is unported in `packages/trailties/src/application/configuration.test.ts`.

## Converged shape

`configFor(name: string | Pathname, { env })` takes the Pathname arm first, exactly as Rails does, using ruby-compat's `Pathname` (`packages/ruby-compat/src/pathname.ts`, which now exists): `name instanceof Pathname ? name : new Pathname(`${configDir}/${name}`)`. The trails body is `Application#configFor` (`packages/trailties/src/application.ts:320`).

## Acceptance criteria

- `configFor` accepts a path object and uses it without joining `config/`.
- `config_for uses the Pathname object if it is provided` is ported under its Rails name.
