---
title: "Engine#paths' root guard and Application#initialize's bootRoot fallback are dead now that root() memoizes into config.root"
status: draft
updated: 2026-09-05
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 70
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced in PR #7504, which closed `remove-application-resolved-root`. That PR
made `Engine#root()` the seat Rails' `delegate :root, to: :config`
(`railties/lib/rails/engine.rb:437`) describes: it resolves
`find_root(called_from)` once, memoizes it into `config.root` via `setRoot`
(`railties/lib/rails/engine/configuration.rb:115-116`), and returns it.

Two guards that existed only because `config.root` used to stay `null` are now
dead weight, and both are invented surface Rails does not have:

1. `packages/trailties/src/engine.ts`, `Engine#paths()`:

   ```ts
   const cfg = this.config;
   if (cfg.root === null) cfg.setRoot(await this.root());
   return cfg.paths();
   ```

   Rails' `Engine#paths` is the same `delegate ... to: :config` at
   `engine.rb:437` — one delegation, no root check, because
   `Engine::Configuration` is constructed with the root already
   (`engine.rb:553`).

2. `packages/trailties/src/application.ts`, `Application#initialize`:

   ```ts
   const bootRoot = await this.root();
   setTrailsRoot(() => this.config.root ?? bootRoot);
   ```

   The `?? bootRoot` arm can no longer be reached through `root()`, since
   `root()` is what wrote `config.root` in the first place.

The reason both survived #7504 is `packages/trailties/src/rails.test.ts`, whose
`Trails.root` cases stub `app.root = async () => "/discovered/source"` on the
instance. A stubbed `root()` never runs the memoizing body, so `config.root`
stays `null` and `paths()` throws "You need to set a path root". The guard in
`paths()` is what keeps those three tests green — which makes the test doubles,
not Rails, the thing holding the shape in place.

## Converged shape

- `Engine#paths()` is `return this.config.paths()` — the delegation Rails has,
  with no root guard.
- `Application#initialize` publishes `setTrailsRoot(() => this.config.root)`
  with no second source for the root.
- `rails.test.ts`'s three `Trails.root` cases stop stubbing `root()` on the
  instance and set the root the way Rails does — through `config.setRoot(...)`,
  or by stubbing the `findRoot`/`calledFrom` class methods that `root()` reads —
  so the production body still runs.

## Acceptance criteria

- [ ] No `cfg.root === null` guard remains in `engine.ts`.
- [ ] No `?? bootRoot` (or equivalent second root source) remains in
      `application.ts`.
- [ ] `packages/trailties/src/rails.test.ts` and `application.test.ts` pass
      without an instance-level `root()` stub.
