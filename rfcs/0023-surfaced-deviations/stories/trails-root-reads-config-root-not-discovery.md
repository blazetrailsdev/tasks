---
title: "Trails.root() should read application.config.root, not Engine source discovery"
status: ready
updated: 2026-06-30
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

trailties' canonical `Trails.root()` (`packages/trailties/src/rails.ts:118`)
returns `Trails.application?.root()` — the Engine source-discovery path
(`findRoot(calledFrom)`) — rather than `application.config.root`. Rails defines
`Rails.root` as `application && application.config.root`
(`railties/lib/rails.rb:65-67`), where `config.root` is the discovered root OR
an explicit `config.root=` override (`engine/configuration.rb:115-116`). So a
`config.setRoot(...)` override is invisible to `Trails.root()`. The method's own
JSDoc already claims `application && application.config.root`, so impl and doc
disagree.

Surfaced during PR #4300 (story `trails-root-app-relative-path-resolution`),
which fixed the ActiveRecord publish path (`Application#initialize` now publishes
a live `() => this.config.root ?? bootRoot` getter to the `trailsRoot()` seam)
but deliberately left the pre-existing `Trails.root()` accessor untouched to stay
in scope.

## Acceptance criteria

- [ ] `Trails.root()` returns `application.config.root` (honoring a
      `config.setRoot(...)` override), falling back to discovery/cwd only when
      `config.root` is unset — matching Rails `rails.rb:65-67`.
- [ ] A test asserts a `config.setRoot(...)` override is visible through
      `Trails.root()` (not just the discovered source root).
- [ ] `Trails.root()` and the `trailsRoot()` seam agree on the resolved root.
