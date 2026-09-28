---
title: "Remove routing's invented surface and fix define_generate_prefix's arity"
status: draft
updated: 2026-09-27
rfc: "0163-actiondispatch-routing-parity"
cluster: null
packages: ["actionpack"]
deps: ["route-set-recognize-routing-test-rewrite-and-delete"]
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:api:extra --package actiondispatch` lists, under
`packages/actionpack/src/action-dispatch/routing/`:

- `journey-bridge.ts`: `journeyRecognize` (novel) and the `JourneyMatch` shape.
  No `routing/journey_bridge.rb` exists; its one caller is `route-set.ts:29`.
  `route-set-recognize-routing-test-rewrite-and-delete` (RFC 0139) removes the
  last test caller of the shape.
- `inspector.ts`: `app`, `inspect`, `verb` (moved). In Rails these readers are
  on `RouteWrapper` (`routing/inspector.rb`), which wraps a `Journey::Route`.
- `redirection.ts`: `template` (moved)
- `route-set.ts`: `recognize` (moved)

`pnpm parity:api --arity` reports `Mapper::Base#define_generate_prefix(app, name)`
(`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/routing/mapper.rb:670`)
against trails' `defineGeneratePrefix(app, name, mountPath)`
(`routing/mapper.ts:1522`). Rails reads the mount path off
`_route.segment_keys` / the named route inside the generated `define_method`,
not from a parameter.

## Acceptance criteria

- `journey-bridge.ts` is deleted; `RouteSet` recognizes through
  `Journey::Router#recognize` / `RouteSet#recognize_path` as Rails does.
- Each moved name is removed or relocated to the file mirroring the `.rb` that
  defines it.
- `defineGeneratePrefix` takes `(app, name)` and derives the prefix as Rails
  does; the arity row is gone.
- `pnpm parity:api:extra --package actiondispatch` lists no `routing/` file.
