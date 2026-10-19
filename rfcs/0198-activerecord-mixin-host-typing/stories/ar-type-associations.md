---
title: "Type the associations hosts and association readers"
status: draft
updated: 2026-10-19
rfc: "0198-activerecord-mixin-host-typing"
cluster: mixin-host-typing
packages: [activerecord]
deps: []
deps-rfc: []
est-loc: 500
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/activerecord/src/associations/` holds about 120 occurrences
(2026-10-19): `collection-association.ts` 27, `preloader/association.ts`
20, `has-many-association.ts` 17, `has-many-through-association.ts` 10,
`collection-proxy.ts` 6, `association.ts` 6, `has-one-association.ts` 6.
Typed owner/target and association-reader types here are what
`ar-type-test-helper-models` needs.

```sh
grep -rcE 'this: any\b|\(this as (any|unknown)|\bas any\b|as unknown as' --include='*.ts' --exclude='*.test.ts' packages/activerecord/src
```

## Acceptance criteria

- [ ] `associations/**` count drops by at least 50%.
- [ ] Association reader / owner / target types are exposed so a model file can read an association without a cast.
- [ ] Typing only: no runtime change, no method moved out of its Rails-mirroring file; `include()` / `extend()` stay the mechanism.
- [ ] `this: any` replaced by a type derived from the module (`Included<typeof Mod>`, `Extended<typeof Mod>`, a declaration-merged `interface Klass`) or a narrow host interface; no hand-copied `Base` signature list.
- [ ] `pnpm parity:api:extra:gate` green, no mark or baseline widened (members of a merged interface and of `interface X extends Y` count).
- [ ] `pnpm typecheck` green; the before/after count from the RFC grep is in the PR body.
