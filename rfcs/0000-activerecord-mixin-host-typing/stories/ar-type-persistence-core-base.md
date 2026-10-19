---
title: "Type the persistence / core / base mixin hosts"
status: draft
updated: 2026-10-19
rfc: "0000-activerecord-mixin-host-typing"
cluster: mixin-host-typing
packages: []
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

RFC § "Host types are derived, not copied". Counts on 2026-10-19:
`packages/activerecord/src/persistence.ts` 50, `core.ts` 40, `base.ts` 32.
These modules are mixed into `Base`, and most casts are `this: any` on
module functions or `(this as any)` reaching a `Base` member.

```sh
grep -rcE 'this: any\b|\(this as (any|unknown)|\bas any\b|as unknown as' --include='*.ts' --exclude='*.test.ts' packages/activerecord/src
```

## Acceptance criteria

- [ ] Combined count for the three files drops by at least 60%.
- [ ] Typing only: no runtime change, no method moved out of its Rails-mirroring file; `include()` / `extend()` stay the mechanism.
- [ ] `this: any` replaced by a type derived from the module (`Included<typeof Mod>`, `Extended<typeof Mod>`, a declaration-merged `interface Klass`) or a narrow host interface; no hand-copied `Base` signature list.
- [ ] `pnpm parity:api:extra:gate` green, no mark or baseline widened (members of a merged interface and of `interface X extends Y` count).
- [ ] `pnpm typecheck` green; the before/after count from the RFC grep is in the PR body.
