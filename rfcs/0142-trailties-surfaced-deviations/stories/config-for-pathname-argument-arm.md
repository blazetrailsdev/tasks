---
title: "configFor drops config_for's Pathname argument arm"
status: blocked
updated: 2026-09-26
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: 5
pr: null
claim: "2026-09-26T02:32:09Z"
assignee: "mapper-root-ships-only-one-of-two-arms"
blocked-by: "Blocked on converge-engine-configuration-root-pathname-new, which owns the trails Pathname decision (port Ruby's Pathname from vendor/ruby/v3.3.11/ext/pathname vs. declaring the path adapter the rendering). No trails package defines a Pathname. A URL spelling would also need a fileURLToPath on ruby-compat's PathAdapter (fs-adapter.ts:122 has only pathToFileURL) to run Rails' yaml.exist? check (application.rb:289-290). Deciding the path-object type inside configFor alone would fork that decision."
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

`configFor(name: string | <path object>, { env })` takes the Pathname arm first, exactly as Rails does. ruby-compat has no `Pathname` today, so decide first whether one lands there (`vendor/ruby/ext/pathname`) or whether a `URL` is the trails spelling. Then port the arm and the test.

## Acceptance criteria

- `configFor` accepts a path object and uses it without joining `config/`.
- `config_for uses the Pathname object if it is provided` is ported under its Rails name.
