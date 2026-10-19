---
title: "Type the remaining activerecord src files no cluster story owns"
status: draft
updated: 2026-10-19
rfc: "0000-activerecord-mixin-host-typing"
cluster: mixin-host-typing
packages: [activerecord]
deps: []
deps-rfc: []
est-loc: 700
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

About 800 of the 2026-10-19 lines sit in non-test `packages/activerecord/src`
files that no cluster story names (everything outside persistence/core/base,
reflection, relation + query-methods, attribute-methods + model-schema,
`associations/`, `connection-adapters/abstract/` and `test-helpers/models/`).
Without this story the RFC's 40% target is unreachable. Rank files by the
RFC's grep and take the largest first.

```sh
grep -rcE 'this: any|\(this as (any|unknown)|as any|as unknown as' --include='*.ts' --exclude='*.test.ts' packages/activerecord/src | sort -t: -k2 -rn
```

## Acceptance criteria

- [ ] The uncovered files' combined count drops by at least 30%; if that exceeds one PR, ship what fits and register the remainder as a new story.
- [ ] Typing only: no runtime change, no method moved out of its Rails-mirroring file; `include()` / `extend()` stay the mechanism.
- [ ] `this: any` replaced by a type derived from the module (`Included<typeof Mod>`, `Extended<typeof Mod>`, a declaration-merged `interface Klass`) or a narrow host interface; no hand-copied `Base` signature list.
- [ ] `pnpm parity:api:extra:gate` green, no mark or baseline widened (members of a merged interface and of `interface X extends Y` count).
- [ ] `pnpm typecheck` green; the before/after count from the RFC grep is in the PR body.
