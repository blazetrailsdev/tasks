---
title: "Type the relation and query-methods hosts"
status: draft
updated: 2026-10-19
rfc: "0198-activerecord-mixin-host-typing"
cluster: mixin-host-typing
packages: [activerecord]
deps: []
deps-rfc: []
est-loc: 450
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/activerecord/src/relation.ts` 44 and `relation/query-methods.ts`
26 (2026-10-19). `QueryMethods` and siblings are included into `Relation`
via `include()` / `Included<>`; RFC 0107 decomposed `relation.ts`, so
the host type should come from `Included<typeof QueryMethods>` and the
`Relation` merged interface, not a copied list.

```sh
grep -rcE 'this: any\b|\(this as (any|unknown)|\bas any\b|as unknown as' --include='*.ts' --exclude='*.test.ts' packages/activerecord/src
```

## Acceptance criteria

- [ ] Combined count for the two files drops by at least 60%, and other `relation/*.ts` modules touched do not rise.
- [ ] Typing only: no runtime change, no method moved out of its Rails-mirroring file; `include()` / `extend()` stay the mechanism.
- [ ] `this: any` replaced by a type derived from the module (`Included<typeof Mod>`, `Extended<typeof Mod>`, a declaration-merged `interface Klass`) or a narrow host interface; no hand-copied `Base` signature list.
- [ ] `pnpm parity:api:extra:gate` green, no mark or baseline widened (members of a merged interface and of `interface X extends Y` count).
- [ ] `pnpm typecheck` green; the before/after count from the RFC grep is in the PR body.
