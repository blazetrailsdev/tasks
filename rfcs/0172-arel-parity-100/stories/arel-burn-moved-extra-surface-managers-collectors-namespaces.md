---
title: "arel: burn the 14 moved extras on managers, collectors, table and namespaces"
status: ready
updated: 2026-09-30
rfc: "0172-arel-parity-100"
cluster: placement
packages: ["arel"]
deps: ["override-of-inherited-rails-member-scores-moved"]
deps-rfc: []
est-loc: 260
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The non-node half of arel's 35 moved extras (`pnpm parity:api:extra --package arel`):

- `packages/arel/src/namespaces.ts` — `Nodes`, `Visitors`
- `packages/arel/src/select-manager.ts` — `ast`, `withRecursive`
- `packages/arel/src/collectors/bind.ts` — `append`
- `packages/arel/src/collectors/composite.ts` — `append`
- `packages/arel/src/collectors/plain-string.ts` — `append`
- `packages/arel/src/collectors/substitute-binds.ts` — `append`
- `packages/arel/src/delete-manager.ts` — `ast`
- `packages/arel/src/index.ts` — `Collectors`
- `packages/arel/src/insert-manager.ts` — `ast`
- `packages/arel/src/table.ts` — `klass`
- `packages/arel/src/update-manager.ts` — `ast`
- `packages/arel/src/visitors/dot.ts` — `compile`

`ast` on the four managers is `TreeManager#ast`'s `attr_reader` (`vendor/rails/v8.0.2/activerecord/lib/arel/tree_manager.rb`) re-declared to
narrow its type; `append` on the four collectors is `Collectors::PlainString#<<`/`Bind#<<` spelled per
class; `namespaces.ts` / `index.ts` export the `Arel::Nodes` / `Arel::Visitors` / `Arel::Collectors`
namespace objects CLAUDE.md § "Call-time constant resolution" ratifies — those are candidates for
the `[no Rails counterpart]` file mapping in `scripts/parity/conventions.ts`, not for receipts.

## Acceptance criteria

- [ ] Each name above is relocated to the file mirroring its defining `.rb`, credited by a scorer fix (`override-of-inherited-rails-member-scores-moved`, or a `RUBY_FILE_TS_OVERRIDES` mapping for `namespaces.ts`/`index.ts`), or deleted.
- [ ] arel's extra-surface `total` reaches **0**, and `pnpm parity:api:extra:tighten` writes it.

## Verification

```bash
pnpm parity:api:extra --package arel && pnpm parity:api:moves && pnpm parity:api:extra:gate && pnpm lint --fix
```
