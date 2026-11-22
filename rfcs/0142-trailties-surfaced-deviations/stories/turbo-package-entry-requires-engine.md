---
title: "@blazetrails/turbo's entry loads its engine, as turbo-rails.rb requires turbo/engine"
status: draft
updated: 2026-11-22
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/turbo-rails/v2.0.23/lib/turbo-rails.rb:1` is `require "turbo/engine"`, so `Bundler.require` loading the gem installs
`Turbo::Broadcastable` on `ActiveRecord::Base` through the engine's `on_load(:active_record)`
(`lib/turbo/engine.rb`). trails' package entry `packages/turbo/lib/turbo-trails.ts` only does `import type { Engine } from "./engine.js"`,
so `Bundler.require` importing `@blazetrails/turbo` never loads the engine, and a model's `broadcastsTo` is
`TypeError: this.broadcastsTo is not a function` until the app adds `import "@blazetrails/turbo/engine"` itself (found in trails#10547's broadcast check).

## Acceptance criteria

- `turbo-trails.ts` imports `./engine.js` for its side effect, as `turbo-rails.rb:1` requires it, keeping module-eval order free of TDZ (verify with a plain-node import of the built entry).
- A generated app with `@blazetrails/turbo` in `dependencies` and no explicit engine import can call `broadcastsTo` in a model.
