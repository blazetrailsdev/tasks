---
title: "rack-builder-map-stores-block-generate-map-builds-per-entry"
status: draft
updated: 2026-10-16
rfc: "0165-actiondispatch-middleware-parity"
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

`Builder#generate_map` (`vendor/rack/v3.1.14/lib/rack/builder.rb:284-288`) builds each mapped app as `self.class.new(default_app, &b).to_app`: `map` stores the block (`builder.rb` `map`: `@map[path] = block`), and the inner builder inherits the outer `default_app`. trails' `Builder#map` (`packages/rack/src/builder.ts`) runs the block eagerly into a fresh `new Builder()` and stores `inner.toApp()`; `generateMap` stores those apps directly, so the inner builder never sees `default_app` and `map` cannot be called after `toApp` with Rails' laziness. Also `use` after `map` does not wrap the pending map in a `generate_map` proc as Rails' `use` does.

## Acceptance criteria

- `map` stores the block; `generateMap` builds `new this.constructor(defaultApp, {}, b).toApp()` per entry, as `builder.rb:286`.
- `use` after `map` folds the pending map into a `generate_map` proc as Rails' `use` does.
- `builder.test.ts` passes.
