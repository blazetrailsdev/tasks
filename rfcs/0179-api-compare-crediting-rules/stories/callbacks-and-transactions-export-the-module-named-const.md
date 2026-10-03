---
title: "activerecord: callbacks.ts and transactions.ts export Callbacks / Transactions in place of InstanceMethods"
status: draft
updated: 2026-10-03
rfc: "0179-api-compare-crediting-rules"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Follow-up to trails#8437, which taught the comparator to read a const named after the Rails module as that module's instance seat (`tsMemberStatesSeat` in `scripts/api-compare/compare.ts`) and renamed `timestamp.ts`, `persistence.ts` and `normalization.ts` onto it.

Two top-level activerecord files still group a Rails module's instance half in an object literal named `InstanceMethods`, a name neither Rails file declares:

- `packages/activerecord/src/callbacks.ts:18` `InstanceMethods`: `module Callbacks` (`vendor/rails/v8.0.2/activerecord/lib/active_record/callbacks.rb:278`), with `module ClassMethods` at `:288`.
- `packages/activerecord/src/transactions.ts:77` `InstanceMethods`: `module Transactions` (`vendor/rails/v8.0.2/activerecord/lib/active_record/transactions.rb:5`), with `module ClassMethods` at `:229`.

`base.ts:118,320` imports them as `CallbacksInstanceMethods` / `TransactionsInstanceMethods` and includes them at `:2497-2498`. The settled spelling is `include(Base, Callbacks.Callbacks)`, as `Timestamp.Timestamp` is now.

Neither carries a `@noRailsEquivalent` receipt today, so nothing reds; the name is still not Rails'. `touch-later.ts`, `model-schema.ts` and `locking/optimistic.ts` have the same shape and already have their own stories (`touch-later-touch-takes-rails-parameters-and-resumes-through-super-method`, `model-schema-instance-readers-come-from-delegate-to-class`, `optimistic-locking-instance-methods-fold-into-the-optimistic-module`).

## Acceptance criteria

- [ ] `callbacks.ts` exports `Callbacks` and `transactions.ts` exports `Transactions` in place of `InstanceMethods`; `base.ts` and every other importer include them by that name.
- [ ] `pnpm parity:api` holds the current `callbacks.rb` and `transactions.rb` figures; if a name either Rails file declares on both halves loses its pairing, the fix is in `tsMemberStatesSeat`, not a revert.
- [ ] `pnpm parity:api:calls`, `:extra:gate` and `:receipts:gate` green.
