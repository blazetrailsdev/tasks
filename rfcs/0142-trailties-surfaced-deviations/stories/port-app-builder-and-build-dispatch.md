---
title: "port-app-builder-and-build-dispatch"
status: draft
updated: 2026-09-28
rfc: "0142-trailties-surfaced-deviations"
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

# Port AppBuilder / ActionMethods and AppBase#build dispatch

## Context

Rails puts every app-file builder method (`rakefile`, `readme`, `gemfile`, `dockerfiles`,
`rubocop`, `cifiles`, `config`, `database_yml`, ...) on `Rails::AppBuilder`
(`vendor/rails/v8.0.2/railties/lib/rails/generators/rails/app/app_generator.rb:45-300`), which
includes `ActionMethods` (`:7-28`: `initialize(generator)`, `options`, private delegators for
`template copy_file directory empty_directory inside empty_directory_with_keep_file create_file
chmod shebang`, and `method_missing` to the generator). `AppGenerator`'s `create_*` steps call
`build(:name)` (`:352-445`), and `AppBase#builder` / `#build` (`generators/app_base.rb:162-172`)
instantiate `get_builder_class` (`app_generator.rb:606-608`: `::AppBuilder` if the user defined
one, else `Rails::AppBuilder`) and `public_send` if it responds. That is the documented extension
point for overriding app generation.

trails has none of it. Every builder method lives on `AppGenerator`
(`packages/trailties/src/generators/app-generator.ts`: `eslint()`, `dockerfiles`, `databaseYml()`,
`cifiles()`, ...) and each `create*` step calls it directly. Surfaced by review on trails#8226
(`cifiles` added in the existing shape).

## Acceptance criteria

- An `AppBuilder` class with `ActionMethods` holds the builder methods, in Rails member order.
- `AppBase#builder` / `#build(meth, ...args)` and `AppGenerator#getBuilderClass` exist, and every
  `create*` step dispatches through `build("...")` as `app_generator.rb:352-445` does.
