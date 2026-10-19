---
title: "Type the reflection hosts"
status: draft
updated: 2026-10-19
rfc: "0000-activerecord-mixin-host-typing"
cluster: mixin-host-typing
packages: []
deps: [ar-cast-count-ratchet]
deps-rfc: []
est-loc: 400
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/activerecord/src/reflection.ts` has 50 occurrences (2026-10-19),
the joint highest source file. RFC 0009's w4 (reflection discriminated union,
done) settled the macro union; what remains is reflection methods reading
`activeRecord` / `options` / owner state through `any`.

```sh
grep -rcE 'this: any\b|\(this as (any|unknown)|\bas any\b|as unknown as' --include='*.ts' --exclude='*.test.ts' packages/activerecord/src
```

## Acceptance criteria

- [ ] `reflection.ts` count drops by at least 60%.
- [ ] Typing only: no runtime change, no method moved out of its Rails-mirroring file; `include()` / `extend()` stay the mechanism.
- [ ] `this: any` replaced by a type derived from the module (`Included<typeof Mod>`, `Extended<typeof Mod>`, a declaration-merged `interface Klass`) or a narrow host interface; no hand-copied `Base` signature list.
- [ ] `pnpm parity:api:extra:gate` green, no mark or baseline widened (members of a merged interface and of `interface X extends Y` count).
- [ ] `pnpm typecheck` green; `pnpm parity:types:casts:tighten` run and the lowered marks committed.
