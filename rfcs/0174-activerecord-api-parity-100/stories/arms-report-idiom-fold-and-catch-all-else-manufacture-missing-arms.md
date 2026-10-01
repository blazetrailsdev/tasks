---
title: "arms-report-idiom-fold-and-catch-all-else-manufacture-missing-arms"
status: draft
updated: 2026-10-01
rfc: "0174-activerecord-api-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:api:arms:report --package=activerecord --direction=missing` reports three
connection-adapters rows whose TS body already takes every arm the Rails body takes. The
missing tokens are produced by the comparer, not by the port.

Two come from `skeletonIdiomLowering` (`scripts/api-compare/enumerable-idioms.ts:297-309`).
An alternative lowering is eligible when the counterpart stream `includes` each of its
tokens, with no accounting for the tokens the Ruby stream already spends natively. Any TS
body carrying one `if` for an unrelated Rails `if` therefore turns every `compact` / `uniq`
in the Ruby body into an extra `if`, which contradicts the table's own contract ("it can
never manufacture a missing arm, only cancel an invented one",
`enumerable-idioms.ts:222-226`):

- `connection-adapters/abstract/connection-handler.ts#retrieveConnectionPool` reports
  `-if -if`. Rails has 5 arms
  (`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/abstract/connection_handler.rb:214-237`:
  the `strict` guard, three `unless` modifiers, one `if` modifier) and the port has 5. The
  two `.compact` calls at `:222,227` each fold to `if` because the port has `if`s at all.
- `connection-adapters/abstract/transaction.ts#beforeCommitRecords` reports `-loop`. Rails'
  `records.uniq.each(&:before_committed!)`
  (`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/abstract/transaction.rb:288`)
  folds `uniq` to `loop if` because the port has a loop and an `if` elsewhere.

The third comes from `visitCatchArms` (`scripts/api-compare/extract-ts-api.ts:4721-4731`):
a trailing `else` on an `instanceof` chain inside a `catch` emits no `rescue`.

- `connection-adapters/abstract/transaction.ts#withinNewTransaction` reports `-rescue`.
  Rails has `rescue ActiveRecord::ConnectionFailed` then `rescue Exception`
  (`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/abstract/transaction.rb:639-646`).
  JS has no class every thrown value is an instance of, so the catch-all clause can only be
  the `else` of the `instanceof ConnectionFailed` test, and that `else` is not counted. An
  `else { throw e; }` that only re-raises is the lowering of a SINGLE typed rescue and must
  keep emitting nothing.

## Acceptance criteria

- [ ] An idiom alternative is eligible only against the counterpart's SURPLUS control tokens
      (its multiset minus the tokens the Ruby stream emits natively and the ones earlier
      folds already claimed), so a fold never raises the Ruby arm count above the port's.
- [ ] A catch-all `else` arm of an `instanceof` chain in a `catch` emits `rescue` when its
      body does more than re-raise the caught value.
- [ ] `retrieveConnectionPool`, `beforeCommitRecords` and `withinNewTransaction` carry no
      missing-direction token in the arms report, with no change to their TS bodies.
- [ ] `scripts/api-compare` tests cover both rules; `pnpm parity:api:arms:throws` is unchanged.
