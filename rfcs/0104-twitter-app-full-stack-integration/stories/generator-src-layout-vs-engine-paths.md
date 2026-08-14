---
title: "trails new emits a src/ layout the engine's path set does not declare, so generated apps find no routes or views"
status: draft
updated: 2026-08-14
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: ["trailties"]
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`trails new` generates a `src/`-prefixed layout, but the engine's path set
declares Rails' root-level one, so a generated app boots with no routes and no
views.

`packages/trailties/src/engine/configuration.ts:70-89` declares the Rails
layout:

```ts
paths.add("app/controllers", { eagerLoad: true });
paths.add("app/views");
paths.add("config/routes.ts");
paths.add("config/locales", { glob: "**/*.{ts,js,json}" });
```

`packages/trailties/src/generators/app-generator.ts` emits
`src/app/controllers/`, `src/app/views/`, `src/config/routes.ts`,
`src/config/locales/`. Nothing reconciles the two, so after #6517 routed
`trails server` through `Trailties.Application`, a freshly generated app
answers `No route matches [GET] "/"` and then
`MissingTemplate ... (no resolvers)`.

`commands/server.ts` already knows about the split — its `requireApplication`
probes `config/application.ts` _and_ `src/config/application.ts`, describing
the latter as "the `src/`-prefixed layout `trails new` currently generates" —
but only for that one file. The path set never learned.

Rails has no `src/`: `Rails::Engine::Configuration#paths`
(`railties/lib/rails/engine/configuration.rb:41-73`) declares `app/…`,
`config/…`, `db/…` relative to the app root, and the app generator writes
exactly those.

`examples/twitter-app` works around it with a `paths()` override in its
`Application` subclass, using Rails' `with:` remap
(`railties/lib/rails/paths.rb`).

## Converged shape

One layout wins, and the obvious one is Rails': the generator emits `app/`,
`config/`, `db/` at the root and drops the `src/` prefix, matching
`engine/configuration.ts` and every Rails app. The alternative — teaching the
path set the `src/` prefix — keeps a layout Rails does not have and leaves
`requireApplication`'s dual probe permanently.

## Acceptance criteria

- A default `trails new` app boots, routes, and renders with no `paths()`
  override.
- The generator and `engine/configuration.ts` agree on one layout.
- `requireApplication` probes a single spelling.
- `examples/twitter-app` drops its `paths()` override and its `TODO`.
