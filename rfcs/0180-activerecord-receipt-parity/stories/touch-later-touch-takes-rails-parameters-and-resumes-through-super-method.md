---
title: "activerecord: TouchLater is a module-named const whose touch takes Rails' parameters and resumes through superMethod"
status: done
updated: 2026-10-09
rfc: "0180-activerecord-receipt-parity"
cluster: findings
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 180
priority: null
pr: trails#8704
claim: "2026-10-09T12:28:18Z"
assignee: "sql-datetime-formatters-fold-into-quoted-date-and-quoted-time"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by the `activerecord-audit-permanent-receipts-root-n-z` audit: the receipts below were `PERMANENT`, no CLAUDE.md section ratifies them, and they are re-tagged `CONVERGEABLE` onto this story.

`packages/activerecord/src/touch-later.ts` groups `touchLater`, `touch` and `beforeCommittedBang` in an
object literal named `InstanceMethods`. `module TouchLater`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/touch_later.rb:5`) has no such submodule, so the
name scores as a moved extra and carries `@noRailsEquivalent`.

The audit renamed it `TouchLater`, the settled spelling for a Rails module (`CounterCache`, `SignedId`),
and reverted: under the module's name the comparator pairs `TouchLater#touch` and
`pnpm parity:api:params` goes from 0 to 1 on `touch_later.rb`. Rails' signature is
`touch(*names, time: nil)` (`touch_later.rb:38`), reaching `Persistence#touch` with `super` at
`:41,44`. trails' is `touch(args, superFn)`, a threaded continuation `base.ts` passes in by hand; under
`InstanceMethods` that pair is not compared at all. `before_committed!` (`:6-9`) ends in `super` too,
and trails calls `transactions.ts`'s `beforeCommittedBang` by import.

The converged shape is the one trails#8368 gave `ActiveModel::Dirty#init_attributes`, and that
`activemodel-super-first-parameters-onto-super-method` (RFC 0173) carries through ActiveModel: the
method takes Rails' parameter list and reaches the next implementation through `superMethod`, with
the module's link included in Rails' ancestry order.

## Acceptance criteria

- [ ] `touch-later.ts` exports `TouchLater`; the `InstanceMethods` receipt is deleted.
- [ ] `touch` takes `(...names, { time })` and resumes through `superMethod`, as does `beforeCommittedBang`; `base.ts` passes no continuation.
- [ ] `pnpm parity:api:params` stays at 0 for `touch_later.rb`; `pnpm parity:api:extra:gate` and `:receipts:gate` green.
- [ ] `packages/activerecord/src/touch-later.test.ts` and `timestamp.test.ts` stay green.
