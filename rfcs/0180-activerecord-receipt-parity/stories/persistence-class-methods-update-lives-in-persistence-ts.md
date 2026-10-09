---
title: "activerecord: Persistence::ClassMethods#update / #update! live in persistence.ts, not as Base statics"
status: draft
updated: 2026-10-09
rfc: "0180-activerecord-receipt-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by trails#8704, as the blocker of `persistence-is-a-module-included-into-base`.

`Persistence::ClassMethods#update` and `#update!`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/persistence.rb:132-180`) are defined in
`persistence.rb`. trails defines them as `static update` / `static updateBang` in the class body of
`packages/activerecord/src/base.ts`, and `packages/activerecord/src/persistence.ts` holds only the
instance `update` / `updateBang` (`Persistence#update`, `persistence.rb`).

While `persistence.ts` exports `Persistence` as a plain object, the comparer does not pair the Rails
class methods with anything in the file. Once `Persistence` is a `Module` (the shape
`persistence-is-a-module-included-into-base` needs for `Persistence#touch`), it pairs
`ClassMethods#update` / `#update!` with the instance functions, and `pnpm parity:api:calls` reports
four new rows: `update` and `update!` each omitting `all` and `find`, which only the class methods
call.

## Acceptance criteria

- [ ] `Persistence::ClassMethods#update` and `#update!` live in `persistence.ts` (a `ClassMethods`
      object `extend`ed onto `Base`), with Rails' bodies; the `static` members in `base.ts` are
      deleted.
- [ ] With `Persistence` exported as a `Module`, `pnpm parity:api:calls` reports no row for
      `persistence.ts` `update` / `update!`, and no baseline row is added.
- [ ] `packages/activerecord/src/persistence.test.ts` stays green.

## Verification

```bash
pnpm parity:api:calls && pnpm vitest run packages/activerecord/src/persistence.test.ts
```
