---
title: "Converge activesupport slots onto ActiveSupport::Autoload"
status: draft
updated: 2026-09-15
rfc: "0000-activesupport-autoload-slot-registry"
cluster: autoload
packages:
  - activesupport
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

- `trails-slot.ts`
- `trails-logger-slot.ts`
- `broadcast-logger-slot.ts`
- `cache/format-version-slot.ts`
- `action-dispatch-request-slot.ts`

These slots are not in CLAUDE.md's instance list. Establish for each whether it breaks a cycle (so it becomes `autoload`) or reaches a package activesupport cannot depend on (`action-dispatch-request-slot.ts`, `trails-slot.ts`). Rails reaches the latter through `on_load` hooks or `defined?` guards, so port it that way instead.
Follow the read shape settled by `converge-arel-node-slots-onto-autoload` (RFC Open question 1). Do not re-decide it per package.

## Acceptance criteria

- Each slot module listed is deleted; its constants are registered with `autoload` / `eagerAutoload` on the namespace that Rails spells, and readers resolve them at call time with no guard (CLAUDE.md § "Call-time constant resolution").
- For every cycle a slot broke, a plain-node import of the built `dist/**.js` defining module AND its reader as entry modules does not throw TDZ — vitest does not count.
- `pnpm parity:api:extra:gate` `total` does not rise (removed setters should lower it; tighten with `parity:api:extra:tighten`), and `parity:api:calls` / `:args` stay green.
