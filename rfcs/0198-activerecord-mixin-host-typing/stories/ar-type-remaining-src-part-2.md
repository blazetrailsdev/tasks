---
title: "ar-type-remaining-src-part-2"
status: done
updated: 2026-10-20
rfc: "0198-activerecord-mixin-host-typing"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#9140
claim: "2026-10-20T14:18:13Z"
assignee: "ar-type-remaining-src-part-2"
blocked-by: null
closed-reason: null
---

## Context

`ar-type-remaining-src` took the uncovered (no-cluster) activerecord src count from 327 to 269 by the RFC grep. Remaining largest files and the blockers found:

- `encryption/encryptable-record.ts` (21 `this: any`): typing as `typeof Base` / `Base` breaks the mock hosts in `encryptable-record.trails.test.ts` and `configurable.test.ts`, `this.constructor` is `Function`, and `_deterministicEncryptedAttributes` / `encryptedAttributes` are undeclared on Base. Needs a narrow host interface.
- `transactions.ts:203-205,318,336-346`: `_committedAlreadyCalled` / `_triggerUpdateCallback` etc. are both ivars and same-named functions mixed into Base (`base.ts:2419-2421`), so the ivar reads cannot be typed off `Base` without separating them.
- `locking/optimistic.ts:93-99,169,177,204`: `ClassMethods` host lacks `_lockingColumn`/`reloadSchemaFromCache`; `InstanceLockingHost` lacks `_queryConstraintsHash`, `columnForAttribute`, `_readAttribute`.
- `relation/calculations.ts`, `aggregations.ts`, `inheritance.ts`, `signed-id.ts`, `touch-later.ts`, `relation/spawn-methods.ts`: `(this as any)` / `.call(this as any)` removal produces type errors in each.

## Acceptance criteria

- [ ] The uncovered files' combined count (RFC grep) drops from 269 to at most 229 (30% of the original 327).
- [ ] Typing only, no runtime change; no hand-copied `Base` signature list.
- [ ] `pnpm parity:api:extra:gate` and `pnpm typecheck` green.
