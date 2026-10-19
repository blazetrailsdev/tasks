---
title: "Type the abstract connection-adapter mixin hosts"
status: ready
updated: 2026-10-19
rfc: "0198-activerecord-mixin-host-typing"
cluster: mixin-host-typing
packages: [activerecord]
deps: []
deps-rfc: []
est-loc: 350
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/activerecord/src/connection-adapters/abstract/` holds about 66
occurrences (2026-10-19): `database-statements.ts` 25,
`schema-statements.ts` 15, `query-cache.ts` 8, `connection-pool.ts` 7,
`schema-creation.ts` 5. These modules mix into `AbstractAdapter`. Watch the
adapter mixin declaration drift test
(`scripts/mixin-declaration-drift.test.ts`) and the abstract-adapter body
pins when touching the merged `interface AbstractAdapter`.

```sh
grep -rcE 'this: any\b|\(this as (any|unknown)|\bas any\b|as unknown as' --include='*.ts' --exclude='*.test.ts' packages/activerecord/src
```

## Acceptance criteria

- [ ] `connection-adapters/abstract/**` count drops by at least 50%; driver-boundary casts may stay.
- [ ] Typing only: no runtime change, no method moved out of its Rails-mirroring file; `include()` / `extend()` stay the mechanism.
- [ ] `this: any` replaced by a type derived from the module (`Included<typeof Mod>`, `Extended<typeof Mod>`, a declaration-merged `interface Klass`) or a narrow host interface; no hand-copied `Base` signature list.
- [ ] `pnpm parity:api:extra:gate` green, no mark or baseline widened (members of a merged interface and of `interface X extends Y` count).
- [ ] `pnpm typecheck` green; the before/after count from the RFC grep is in the PR body.
