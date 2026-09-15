---
title: "Converge activemodel and actionview slots onto ActiveSupport::Autoload"
status: draft
updated: 2026-09-15
rfc: "0000-activesupport-autoload-slot-registry"
cluster: autoload
packages:
  - activemodel
  - actionview
deps:
  - "converge-arel-node-slots-onto-autoload"
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

Slot modules in scope (`packages/<pkg>/src/`):

- `activemodel: attribute/user-provided-default-slot.ts`
- `actionview: base-slot.ts`
- `actionview: routing-url-for-slot.ts`

`routing-url-for-slot.ts` is NOT a load-order cycle: it stands in for `ActiveSupport.on_load(:action_controller)` mixing `ActionDispatch::Routing::UrlFor` in (`actionview/lib/action_view/railtie.rb:97-101`), because actionview does not depend on actionpack. Classify it: if it is an `on_load` hook in Rails, port it onto `onLoad`/`runLoadHooks`, not `autoload`.
Follow the read shape settled by `converge-arel-node-slots-onto-autoload` (RFC Open question 1). Do not re-decide it per package.

## Acceptance criteria

- Each slot module listed is deleted; its constants are registered with `autoload` / `eagerAutoload` on the namespace that Rails spells, and readers resolve them at call time with no guard (CLAUDE.md § "Call-time constant resolution").
- For every cycle a slot broke, a plain-node import of the built `dist/**.js` defining module AND its reader as entry modules does not throw TDZ — vitest does not count.
- `pnpm parity:api:extra:gate` `total` does not rise (removed setters should lower it; tighten with `parity:api:extra:tighten`), and `parity:api:calls` / `:args` stay green.
