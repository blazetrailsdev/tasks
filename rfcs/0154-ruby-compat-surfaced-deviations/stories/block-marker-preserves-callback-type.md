---
title: "block() marker preserves the marked function's type"
status: draft
updated: 2026-11-18
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`block()` in `packages/ruby-compat/lib/hash.ts:16-27` is typed for Hash blocks first: its first overload is `block<T>(fn: (key: string) => T): Block<T>`, so any marked block (e.g. a `this`-typed middleware block passed to `MiddlewareStack#insertBefore`, `actionpack/lib/action-dispatch/middleware/stack.ts:116-131`) comes back as `(key: string) => T`. A receiver that types its block, like `Rack::Cors#initialize(app, opts = {}, &block)` (`vendor/rack-cors/v3.0.0/lib/rack/cors.rb:29`, `packages/rack-cors/lib/cors.ts`), then cannot accept the marked value without `as unknown as` (trails#10300's `packages/rack-cors/test/unit/cors.trails.test.ts`).

## Acceptance criteria

- `block(fn)` preserves `fn`'s own type (including `this`) plus the brand when `fn` is not a Hash key block, so `new Cors(app, block(function (this: Cors) {}))` typechecks with `opts` typed `CorsOptions | CorsBlock`.
- The `as unknown as` cast in `packages/rack-cors/test/unit/cors.trails.test.ts` is removed.
- Existing Hash `block` call sites still typecheck.
