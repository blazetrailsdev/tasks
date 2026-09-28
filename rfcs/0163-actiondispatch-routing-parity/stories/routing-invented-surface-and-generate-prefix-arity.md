---
title: "Relocate routing's moved names and fix define_generate_prefix's arity"
status: draft
updated: 2026-09-28
rfc: "0163-actiondispatch-routing-parity"
cluster: null
packages: ["actionpack"]
deps: ["route-set-recognize-routing-test-rewrite-and-delete"]
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:api:extra --package actiondispatch` scores, under
`packages/actionpack/src/action-dispatch/routing/`:

- `inspector.ts`: `app`, `inspect`, `verb` (moved). In Rails these readers are
  on `RouteWrapper` (`routing/inspector.rb`), which wraps a `Journey::Route`.
- `redirection.ts`: `template` (moved)

(The invented `journey-bridge.ts` and `route-set.ts`'s moved `recognize` were
removed by RFC 0139's `route-set-recognize-routing-test-rewrite-and-delete`.)

`pnpm parity:api --arity` reports `Mapper::Base#define_generate_prefix(app, name)`
(`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/routing/mapper.rb:670`)
against trails' `defineGeneratePrefix(app, name, mountPath)`
(`routing/mapper.ts:1522`). Rails reads the mount path off
`_route.segment_keys` / the named route inside the generated `define_method`,
not from a parameter.

## Acceptance criteria

- Each moved name is removed or relocated to the file mirroring the `.rb` that
  defines it.
- `defineGeneratePrefix` takes `(app, name)` and derives the prefix as Rails
  does; the arity row is gone.
- `pnpm parity:api:extra --package actiondispatch` lists no `routing/` file.
