---
title: "class-update-converges-onto-persistence-classmethods"
status: done
updated: 2026-09-24
rfc: "0156-parity-beyond-name-presence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#8039
claim: "2026-09-24T17:04:00Z"
assignee: "class-update-converges-onto-persistence-classmethods"
blocked-by: null
closed-reason: null
---

## Context

`Persistence::ClassMethods#update` / `#update!` (`vendor/rails/activerecord/lib/active_record/persistence.rb:132-180`)
are one body each: an `Array` arm (`find` per id, `update` per record), an
`id == :all` arm (`all.each { |record| record.update(attributes) }`), and a
single-id arm raising `ArgumentError` for a `Base` instance.

trails' `Base.update` / `Base.updateBang` (`packages/activerecord/src/base.ts`, the
`static async update` / `updateBang` overload sets) delegate to a module-private
`performClassUpdate(idOrAttrs, attrs, bang)` in `base.ts` that neither Rails method
has, and that invents a composite-PK "parallel" arm, a one-argument
`update(attrs)` sentinel and several `ArgumentError` messages Rails does not raise.
Because the bodies live in the helper, the call gate sees no `all` call in either
static body. Those pairs were first compared when
`compare-owner-on-both-seats-reads-seat-neutral` made the class and instance
`update` rows both match. They carry `@missingRailsCall all — CONVERGEABLE` pointing here.

## Acceptance criteria

- `update` / `update!` class methods live on persistence.ts's class half, one body
  per Rails method, with the arms and messages of `persistence.rb:132-180` in the
  Rails order. `performClassUpdate` is deleted.
- The `@missingRailsCall all` receipts on `Base.update` / `Base.updateBang` are removed and
  `pnpm parity:api:calls` stays green.
- Existing `persistence` tests keep passing; any trails-only arm with no Rails
  counterpart is dropped along with its trails-only test.
