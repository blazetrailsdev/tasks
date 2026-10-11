---
title: "activerecord: destroy! is typed Promise<this> but answers true on re-entry, as destroy || _raise_record_not_destroyed does"
status: draft
updated: 2026-10-11
rfc: "0189-activerecord-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 50
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Left over from `base-destroy-declared-return-type-omits-the-reentrant-true-arm` (trails#8774).

`Persistence#destroy!` (`vendor/rails/v8.0.2/activerecord/lib/active_record/persistence.rb:469-471`) is
`destroy || _raise_record_not_destroyed`, so it answers whatever truthy value `destroy` answered. Since
`Callbacks#destroy` answers `true` on re-entry (`callbacks.rb:421`), a re-entrant `destroy!` answers `true`.

`packages/activerecord/src/persistence.ts:580-584` `destroyBang` is declared `Promise<T>`, and
`packages/activerecord/src/base.ts` declares `destroyBang(): Promise<this>`. trails#8774 widened
`destroy` to `Promise<this | boolean>`; `destroyBang` still type-checks only because the right-hand side
of its `||` is read through `(this as any)._raiseRecordNotDestroyed()`, which makes the whole expression `any`.

## Acceptance criteria

- [ ] `destroyBang` is declared `Promise<T | true>` in `persistence.ts` and `Promise<this | true>` on `Base`, with `_raiseRecordNotDestroyed` typed `never` and called without the `any` cast.
- [ ] Every call site that reads a member off `await record.destroyBang()` type-checks, narrowed where it has to be, with no cast added to hide the `true` arm.
- [ ] A `.trails.test.ts` case pins a re-entrant `destroyBang()` answering `true`.
- [ ] `pnpm typecheck` and `pnpm test:types` are clean.
