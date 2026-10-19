---
title: "Type the canonical test-helper models"
status: draft
updated: 2026-10-19
rfc: "0000-activerecord-mixin-host-typing"
cluster: test-model-typing
packages: []
deps: [ar-type-associations]
deps-rfc: []
est-loc: 600
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

About 400 occurrences (2026-10-19) are in
`packages/activerecord/src/test-helpers/models/`: `post.ts` 66,
`author.ts` 64, `developer.ts` 49, `company.ts` 35, `topic.ts` 31. Most
are association reads and scope lambdas that become cast-free once
`ar-type-associations` exposes typed readers. These models mirror
`vendor/rails/v8.0.2/activerecord/test/models/`; their Rails shape is not
changed.

```sh
grep -rcE 'this: any\b|\(this as (any|unknown)|\bas any\b|as unknown as' --include='*.ts' --exclude='*.test.ts' packages/activerecord/src
```

## Acceptance criteria

- [ ] `test-helpers/models/**` count drops by at least 50%; if more than one PR is needed, register the remainder as a new story.
- [ ] No model, table or fixture is added or renamed.
- [ ] Typing only: no runtime change, no method moved out of its Rails-mirroring file; `include()` / `extend()` stay the mechanism.
- [ ] `this: any` replaced by a type derived from the module (`Included<typeof Mod>`, `Extended<typeof Mod>`, a declaration-merged `interface Klass`) or a narrow host interface; no hand-copied `Base` signature list.
- [ ] `pnpm parity:api:extra:gate` green, no mark or baseline widened (members of a merged interface and of `interface X extends Y` count).
- [ ] `pnpm typecheck` green; the before/after count from the RFC grep is in the PR body.
