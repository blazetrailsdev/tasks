---
title: "activerecord: authenticate_by's found arm runs ~0.2 ms slower than its not-found arm, leaving the timing test marginal"
status: ready
updated: 2026-10-10
rfc: "0174-activerecord-api-parity-100"
cluster: null
packages: []
deps:
  - activerecord-super-first-parameters-onto-super-method
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`SecurePasswordTest > authenticate_by takes the same amount of time regardless
of whether record is found`
(`packages/activerecord/src/secure-password.test.ts`; Rails
`vendor/rails/v8.0.2/activerecord/test/cases/secure_password_test.rb`) asserts
that 1000 found calls and 1000 not-found calls differ by at most 0.5 s, with
three retries.

On PostgreSQL the record-found arm of `authenticate_by`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/secure_password.rb:41-55`,
`packages/activerecord/src/secure-password.ts`) is systematically slower than
the not-found arm, independent of the trails#8413 regression that trails#8421
fixed:

- Local PostgreSQL 17 at `0d0353b7` (before trails#8413): median
  found-minus-not-found 0.23 s over 10 rounds, with single rounds past 0.5 s.
- Of the four green `main` runs before trails#8413, two needed a second
  attempt (9.1 s and 10.7 s against 4.7 s and 5.3 s). The green run on
  trails#8421 also took two attempts (11.1 s).
- Two reds on `main`, at `f17d8b20` and `79b6a7f`, were four failed attempts
  in a row (story `red-f17d8b20`).

A CPU profile of the found arm (4000 calls, PostgreSQL) put about a third of
the non-bcrypt time in `_instantiate` (`base.ts`): `initWithAttributes`
(`core.ts`) -> the `initInternals` chain through `touch-later.ts`,
`transactions.ts`, `autosave-association.ts`, `associations.ts`,
`timestamp.ts`, `dirty.ts`, `persistence.ts`, each entered through
`prepend.ts`'s `wrapped`, plus `allocate` running the `Base` constructor. The
not-found arm builds a record through `new(passwords)` as well, so the
difference is what `_instantiate` and row decoding cost beyond a plain `new`.

The timestamp wire cast is tracked separately in
`pg-mysql-timestamp-wire-cast-round-trips-instant-bigint-rational`.

## Acceptance criteria

- Profile both arms on PostgreSQL and state in the PR body where the found arm
  spends its extra time.
- Remove the avoidable part by converging the code involved onto Rails'
  bodies (`instantiate_instance_of` / `init_with_attributes`,
  `vendor/rails/v8.0.2/activerecord/lib/active_record/persistence.rb` and
  `core.rb`), with no invented fast path.
- The found-minus-not-found median on PostgreSQL is under 0.15 s over 10
  rounds locally. State the measured numbers.
- The test, its retry count and its 0.5 s delta are not changed.
