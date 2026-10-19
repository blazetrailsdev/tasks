---
title: "Type the attribute-methods and model-schema hosts"
status: done
updated: 2026-10-19
rfc: "0198-activerecord-mixin-host-typing"
cluster: mixin-host-typing
packages: [activerecord]
deps: []
deps-rfc: []
est-loc: 400
priority: null
pr: trails#9073
claim: "2026-10-19T15:06:06Z"
assignee: "ar-type-attribute-methods-model-schema"
blocked-by: null
closed-reason: null
---

## Context

`packages/activerecord/src/attribute-methods.ts` 32 and `model-schema.ts`
35 (2026-10-19), plus `attribute-methods/primary-key.ts` (20) and
`attribute-methods/composite-primary-key.ts` (9). activemodel's
`AttributeMethodHost` (`packages/activemodel/src/attribute-methods.ts:134`)
is the precedent for a narrow host interface.

```sh
grep -rcE 'this: any\b|\(this as (any|unknown)|\bas any\b|as unknown as' --include='*.ts' --exclude='*.test.ts' packages/activerecord/src
```

## Acceptance criteria

- [ ] Combined count for these four files drops by at least 60%.
- [ ] Typing only: no runtime change, no method moved out of its Rails-mirroring file; `include()` / `extend()` stay the mechanism.
- [ ] `this: any` replaced by a type derived from the module (`Included<typeof Mod>`, `Extended<typeof Mod>`, a declaration-merged `interface Klass`) or a narrow host interface; no hand-copied `Base` signature list.
- [ ] `pnpm parity:api:extra:gate` green, no mark or baseline widened (members of a merged interface and of `interface X extends Y` count).
- [ ] `pnpm typecheck` green; the before/after count from the RFC grep is in the PR body.
