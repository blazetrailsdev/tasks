---
title: "trails-root-is-a-pathname"
status: ready
updated: 2026-11-24
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

## Context

`Rails::Engine::Configuration#root=` stores a Pathname
(`vendor/rails/v8.0.2/railties/lib/rails/engine/configuration.rb:115-117`,
`@root = paths.path = Pathname.new(value).expand_path`), and `Rails.root` answers it,
so Rails bodies call Pathname methods on it: `Rails.root.join("vendor")` in
`Engine#fixtures_in_root_and_not_in_vendor_or_dot_dir?` (`railties/lib/rails/engine.rb:741-745`).

trails#10248 converged `setRoot` onto `new Pathname(value).expandPath()`, but
`EngineConfiguration#_root` / `root` and `Trails.root()` are still typed `string`, so
`setRoot` stores `.toString()` and `packages/trailties/lib/engine.ts`
`fixturesInRootAndNotInVendorOrDotDir` uses `getPath().join(root, "vendor")` under a
`@missingRailsArgs join` receipt.

## Acceptance criteria

- [ ] `EngineConfiguration#root` and `Trails.root()` answer a `Pathname` (ruby-compat), and `setRoot` stores it without `.toString()`.
- [ ] `fixturesInRootAndNotInVendorOrDotDir` calls `root.join("vendor")` and its `@missingRailsArgs join` receipt is deleted.
- [ ] Every reader of `root` that needs a string calls `toString()` / `toS` where Rails calls `to_s`.
