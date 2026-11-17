---
title: "engine-configuration-set-root-guards-paths-and-null"
status: draft
updated: 2026-11-17
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

`Rails::Engine::Configuration#root=` (`vendor/rails/v8.0.2/railties/lib/rails/engine/configuration.rb:115-117`)
is `@root = paths.path = Pathname.new(value).expand_path`: it calls `paths` (memoized, so it
builds the Root if needed) and assigns `path` unconditionally, and `Pathname.new(nil)` raises
`TypeError`. trails' `setRoot` (`packages/trailties/lib/engine/configuration.ts`) has a
`value === null ? null : …` arm and writes `this._paths.path` only `if (this._paths)`.
Found in the review of trails#10248.

## Acceptance criteria

- [ ] `setRoot` has no null arm; a `null` value raises as `Pathname.new(nil)` does.
- [ ] `setRoot` assigns `this.paths().path` unconditionally, as Rails' `paths.path =` does.
- [ ] Existing engine/configuration tests stay green, or are updated to Rails' behaviour with the Rails test cited.
