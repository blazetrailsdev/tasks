---
title: "port-eager-load-autoloader-arms"
status: draft
updated: 2026-08-31
rfc: "0104-twitter-app-full-stack-integration"
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

`Finisher`'s `eager_load!` initializer
(`vendor/rails/railties/lib/rails/application/finisher.rb:75-88`) is declared in
`packages/trailties/src/application/finisher.ts` but only its two portable arms
run — `ActiveSupport.run_load_hooks(:before_eager_load, self)` (`:77`) and
`config.eager_load_namespaces.each(&:eager_load!)` (`:80`).

Three calls in the Rails body have no counterpart and carry
`@missingRailsCall` receipts pointing at this story:

- `Zeitwerk::Loader.eager_load_all` (`:78`) — Zeitwerk is unported. ESM resolves
  nothing from a constant name, so there is no loader graph to walk. What trails
  has instead is `loadControllers` in the same file, the eager directory scan
  `setup_main_autoloader` uses to seed `controllerConstants`; a general
  autoloader would subsume it.
- `Rails.eager_load!` (`:79`) — `Trails.eagerLoad` is unported
  (`packages/trailties/src/rails.ts` has no such member); Rails' walks
  `Rails.application.config.eager_load_namespaces`, which the ported arm at
  `:80` already does for the application's own namespaces.
- `app.reloader.after_class_unload { Rails.autoloaders.main.eager_load }`
  (`:82-86`) — `ActiveSupport::Reloader` has no class-unload hook in trails
  (`FinisherReloader` in `finisher.ts` declares only `toPrepare` /
  `prepareBang`), and with no autoloader there is nothing to re-eager-load.

All three are downstream of the same gap: trails has no autoloader. They
converge together or not at all, which is why they are one story.

## Acceptance criteria

- Either the three arms are ported against a real trails autoloader, or the
  story is closed with the autoloader decision recorded and the receipts
  rewritten to `PERMANENT`.
- The three `@missingRailsCall` tags on the `eager_load!` initializer in
  `packages/trailties/src/application/finisher.ts` are removed or re-pointed.
- `pnpm parity:api:calls` stays green.
