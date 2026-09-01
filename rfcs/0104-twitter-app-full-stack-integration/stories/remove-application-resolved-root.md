---
title: "Application#resolvedRoot has no Rails counterpart"
status: draft
updated: 2026-09-01
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Application#resolvedRoot` (`packages/trailties/src/application.ts`) has no
Rails counterpart. Rails seeds `config.root` from `find_root(called_from)` when
the configuration is built
(`vendor/rails/railties/lib/rails/engine.rb`, `Engine.find_root`) and
`Rails::Application::Configuration#root` is `@root ||= find_root(root_or_nil)`
(`vendor/rails/railties/lib/rails/application/configuration.rb`), so
`config.root` is never nil and no second accessor exists.

trails' fs seam is async-only, so `Engine#root()` is a promise and callers that
need a concrete path at boot — `configFor`, the credentials paths, the
`trailsRoot()` publication in `Application#initialize` — go through
`resolvedRoot()` instead.

PR #7353 deleted the `config.root` pin from `Application#initialize` (every
initializer that reads `paths[...]` goes through `Engine#paths()`, which
resolves the root itself, `engine.ts:151`), which was the larger half of
`converge-configuration-root-lazy-find-root`. `resolvedRoot` itself was left in
place; this story is the remainder.

## Converged shape

- `resolvedRoot` is gone, and its three callers reach the root through the
  seat Rails uses — `config.root`, resolved lazily the way
  `Configuration#root` resolves it.
- `packages/trailties/src/application.test.ts`'s `find_root` and
  `initialize!` cases keep passing unchanged.
