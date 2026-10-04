---
title: "thor: burn the two moved extras on thor.ts and move thor to rowless in the extra-surface ratchet"
status: draft
updated: 2026-10-04
rfc: "0171-thor-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#8503 enrolled `thor` in the extra-surface ratchet as a tagged-only package (`TAGGED_ONLY_PACKAGES` in `scripts/api-compare/extra-surface-mark.ts`): `novel` pinned at 0, with a row in `scripts/api-compare/extra-surface-mark.json` seeded at the measured `total: 2`. It could not go rowless because `pnpm parity:api:extra --package thor` lists two moved-not-novel extras, both in `packages/trailties/src/thor/thor.ts`:

- `constructor` — `Thor`'s `constructor(...args) { initializeIncludedModules(this, ...args) }`. Ruby's `Thor` defines no `initialize`; it is `Thor::Base#initialize` (`vendor/thor/v1.3.2/lib/thor/base.rb:53-113`), reached through `include Thor::Base` (`vendor/thor/v1.3.2/lib/thor.rb`). The JS class at the bottom of the chain has to call `initializeIncludedModules` where Ruby's lookup finds the module's `initialize` (`packages/ruby-compat/src/include.ts`, the `initialize` symbol's JSDoc).
- `Group` — `declare static Group` on `Thor`. `Thor::Group` is defined in `vendor/thor/v1.3.2/lib/thor/group.rb`, which has no TS file yet (`port-thor-group`).

## Acceptance criteria

- [ ] `Group` is seated by the module that defines it once `port-thor-group` lands (the namespace-constant seat shape in CLAUDE.md § "Call-time constant resolution"), and no longer scores as a moved extra on `thor.ts`.
- [ ] `constructor` no longer scores as a moved extra: either the extractor credits a class constructor that only calls `initializeIncludedModules` to the included module's `initialize`, or it carries the `@noRailsEquivalent PERMANENT` receipt that shape is ratified under.
- [ ] `pnpm parity:api:extra --package thor` reports `total` 0; `thor` moves from `TAGGED_ONLY_PACKAGES` to `ROWLESS_PACKAGES`, its row is deleted from `extra-surface-mark.json`, and `pnpm parity:api:extra:gate` (whole surface and `--package thor`) is green.
