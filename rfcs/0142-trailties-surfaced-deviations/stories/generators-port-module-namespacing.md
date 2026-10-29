---
title: "Port Generators::Base#module_namespacing and Rails::Generators.namespace"
status: draft
updated: 2026-10-29
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails wraps a generated class in the isolated engine's module through
`Rails::Generators::Base#module_namespacing`
(`vendor/rails/v8.0.2/railties/lib/rails/generators/base.rb:294-299`):
`content = capture(&block)`, then `wrap_with_namespace(content) if namespaced?`,
then `concat(content)`. Its helpers sit beside it: `indent` (`:302-305`),
`wrap_with_namespace` (`:307-310`, `"module #{namespace.name}\n#{indent(content).chomp}\nend\n"`),
`namespace` (`:312-314`, `Rails::Generators.namespace`) and `namespaced?`
(`:316-318`, `!options[:skip_namespace] && namespace`). `Rails::Generators.namespace`
is the `mattr_accessor` an isolated engine sets (`railties/lib/rails/generators.rb:25`,
`engine.rb:401` `isolate_namespace`).

trails has none of these: `packages/trailties/src/generators/base.ts` has no
`moduleNamespacing` / `wrapWithNamespace` / `indent` / `namespace` / `isNamespaced`, and
`packages/trailties/src/generators.ts` has no `Generators.namespace`. So every `.tt` that
opens with `<% module_namespacing do -%>` is ported without it. The first is
`packages/trailties/src/generators/rails/channel/templates/channel.ts.tt` (Rails
`actioncable/lib/rails/generators/channel/templates/channel.rb.tt:1,15`), receipted on
`ChannelGenerator#createChannelFile`. Until an isolated engine can set a namespace the
output is identical, because `namespaced?` is always false.

## Acceptance criteria

- `Generators.namespace` is ported as Rails' module accessor, and `isolateNamespace` sets it.
- `GeneratorBase` ports `moduleNamespacing`, `indent`, `wrapWithNamespace`, `namespace` and
  `isNamespaced` at their Rails names, in `base.rb` order, with `options.skipNamespace`.
- The wrap is the TS spelling of `module Foo … end`: the engine's namespace as a trails
  namespace the finisher seats (directory-as-namespace, `trailties/CLAUDE.md` § "Trails has
  no autoloader"). The PR decides between an `export namespace` block and a
  nested-directory destination and records why.
- `channel.ts.tt` opens with `moduleNamespacing`, and the
  `@missingRailsCall module_namespacing` receipt on `createChannelFile` is deleted.
- `railties/test/generators/namespaced_generators_test.rb` (30 tests, for example
  `test_namespaced_controller_skeleton_is_created` at `:31` and `test_skipping_namespace`
  at `:42`) is ported for the generators trails has. Rails has no namespaced channel
  test, so a TS-only `channel-generator.trails.test.ts` case asserts the wrapped
  `channel.ts` under an isolated namespace.
