---
title: "Boot trails apps through Trailties.Application, delete the bespoke server Application"
status: done
updated: 2026-08-14
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: ["trailties"]
deps:
  - splice-finisher-initializers
deps-rfc: []
est-loc: null
priority: null
pr: 6517
claim: "2026-08-14T12:16:28Z"
assignee: "boot-app-through-trailties-application"
blocked-by: null
closed-reason: null
---

## Context

`trails server` does not boot `Trailties.Application`. There are two classes
named `Application` and the Rails-faithful one is not in the request path.

- `packages/trailties/src/application.ts:29` — `export class Application
extends Engine`, the faithful `Rails::Application` port
  (`vendor/rails/railties/lib/rails/application.rb:63`). Has `initialize()`,
  `initializers`, `routesReloader()`, `configFor()`. Fully tested in
  `application.test.ts`.
- `packages/trailties/src/server/application.ts:27` — `export class
Application`, a bespoke class with **no Rails counterpart**: a hand-rolled
  `dispatch()` (line ~112), controller resolution by filename probing
  (`resolveController`, line ~148), its own `LookupContext` construction
  (`setupViews`, line ~52), and its own dev error page.
- `packages/trailties/src/commands/server.ts:14` constructs `DevServer`,
  which runs the bespoke one. `Trailties.Application` is never instantiated.

Rails has exactly one `Rails::Application`; `rails server` boots it via
`config.ru` → `run Rails.application`
(`vendor/rails/railties/lib/rails/commands/server/server_command.rb`).

Confirmed by grep: outside `application.ts` itself, no file in the repo
references `Trailties.Application`.

## Acceptance criteria

- `trails server` boots `Trailties.Application` — the `application.ts` one.
- `packages/trailties/src/server/application.ts` is deleted, its behavior
  absorbed into the initializer chain (routes loading, controller
  resolution, view path setup) where Rails puts each piece.
- The dev error page moves behind `ActionDispatch::DebugExceptions` rather
  than living in an ad-hoc `catch` in the dispatcher.
- `examples/twitter-app` boots through the ported `Application` with no
  change to its own `src/` beyond `config/application.ts`.
- Depends on the Finisher splice (see the sibling story).
