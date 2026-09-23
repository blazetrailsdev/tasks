---
title: "Converge actionpack, rack-session and trailties slots onto ActiveSupport::Autoload"
status: done
updated: 2026-09-23
rfc: "0151-activesupport-autoload-slot-registry"
cluster: autoload
packages:
  - actionpack
  - rack-session
  - trailties
deps:
  - "converge-arel-node-slots-onto-autoload"
deps-rfc: []
est-loc: 150
priority: 7
pr: trails#7994
claim: "2026-09-23T02:09:19Z"
assignee: "converge-activesupport-slots-onto-autoload"
blocked-by: null
closed-reason: null
---

## Context

Slot modules in scope (`packages/<pkg>/src/`):

- `actionpack: action-dispatch/http/request-slot.ts`
- `rack-session: ruby-class-path-slot.ts`
- `trailties: ruby-class-path-slot.ts`
- `trailties: trails-slot.ts`

The two `ruby-class-path-slot.ts` modules seat Ruby's `self.class` constant path (`rack-session/lib/rack/session/abstract/id.rb:155,396`), not a constant. Classify whether `autoload` is the right home or whether the value belongs on the class itself.
Follow the read shape settled by `converge-arel-node-slots-onto-autoload` (RFC Open question 1). Do not re-decide it per package.

## Acceptance criteria

- Each slot module listed is deleted; its constants are registered with `autoload` / `eagerAutoload` on the namespace that Rails spells, and readers resolve them at call time with no guard (CLAUDE.md § "Call-time constant resolution").
- For every cycle a slot broke, a plain-node import of the built `dist/**.js` defining module AND its reader as entry modules does not throw TDZ — vitest does not count.
- `pnpm parity:api:extra:gate` `total` does not rise (removed setters should lower it; tighten with `parity:api:extra:tighten`), and `parity:api:calls` / `:args` stay green.
