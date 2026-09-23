---
title: "Converge activerecord core slots onto ActiveSupport::Autoload"
status: claimed
updated: 2026-09-23
rfc: "0151-activesupport-autoload-slot-registry"
cluster: autoload
packages:
  - activerecord
deps:
  - "converge-arel-node-slots-onto-autoload"
deps-rfc: []
est-loc: 300
priority: 3
pr: null
claim: "2026-09-23T00:59:14Z"
assignee: "converge-activerecord-core-slots-onto-autoload"
blocked-by: null
closed-reason: null
---

## Context

Slot modules in scope (`packages/<pkg>/src/`):

- `base-slot.ts`
- `connection-handling-slot.ts`
- `model-schema-slot.ts`
- `migration/compatibility-slot.ts`
- `fixture-error-slot.ts`
- `encryption/configurable-slot.ts`
- `load-schema-overrides-slot.ts`
- `relation/uncacheable-methods-slot.ts`

`base-slot.ts` also carries the `ActiveRecord` singleton config-seat reads and the one guarded read (`_Base?.logger` in the adapter constructor, for the standalone sqlite-drivers lane). Preserve that exception's semantics or retire it with its own evidence. Split this story if it passes the LOC ceiling; base-slot is the natural cut.
Follow the read shape settled by `converge-arel-node-slots-onto-autoload` (RFC Open question 1). Do not re-decide it per package.

## Acceptance criteria

- Each slot module listed is deleted; its constants are registered with `autoload` / `eagerAutoload` on the namespace that Rails spells, and readers resolve them at call time with no guard (CLAUDE.md § "Call-time constant resolution").
- For every cycle a slot broke, a plain-node import of the built `dist/**.js` defining module AND its reader as entry modules does not throw TDZ — vitest does not count.
- `pnpm parity:api:extra:gate` `total` does not rise (removed setters should lower it; tighten with `parity:api:extra:tighten`), and `parity:api:calls` / `:args` stay green.
