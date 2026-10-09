---
title: "activerecord: Persistence is a Module included into Base; ClassMethods#update calls all and find"
status: done
updated: 2026-10-09
rfc: "0180-activerecord-receipt-parity"
cluster: null
packages: []
deps:
  - persistence-class-methods-update-lives-in-persistence-ts
deps-rfc: []
est-loc: 250
priority: null
pr: trails#8710
claim: "2026-10-09T14:09:43Z"
assignee: "migration-up-only-guards-on-an-optional-block"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by trails#8704, which made `Transactions` and `Callbacks` `Module`s so `touch` resumes
through `superMethod` (`vendor/rails/v8.0.2/activerecord/lib/active_record/touch_later.rb:38-46`,
`transactions.rb`, `callbacks.rb`).

`Persistence#touch` (`vendor/rails/v8.0.2/activerecord/lib/active_record/persistence.rb`) is the
last link of that chain. `packages/activerecord/src/persistence.ts` exports `Persistence` as a plain
object holding only `_updateRecord`, and it is never included into `Base`, so
`packages/activerecord/src/base.ts` seats `touch` through a one-method anonymous
`new Module((mod) => mod.defineMethod("touch", _Persistence.touch))` included where Rails includes
`Persistence`.

Making `Persistence` itself a `Module` was tried and reverted: with the module-named const a
`Module`, `pnpm parity:api:calls` reports four new rows in `persistence.ts` — `update` and
`update!` each omitting `all` and `find`, the calls `Persistence::ClassMethods#update` /
`#update!` make (`persistence.rb` `def update(id = :all, attributes)` and `def update!`). The rows
are real omissions the plain-object shape hides from the comparer.

## Acceptance criteria

- [ ] `Persistence` in `persistence.ts` is a `Module` defining `touch` (and the instance methods
      `base.ts` hand-chains today), included into `Base` at Rails' position; the anonymous module
      in `base.ts` is deleted.
- [ ] `Persistence::ClassMethods#update` / `#update!` call `all` and `find` as Rails does, so no
      baseline row is added for them.
- [ ] `pnpm parity:api:calls` green with no new row; `packages/activerecord/src/persistence.test.ts`
      and `touch-later.test.ts` stay green.

## Verification

```bash
pnpm parity:api:calls && pnpm vitest run packages/activerecord/src/persistence.test.ts packages/activerecord/src/touch-later.test.ts
```
