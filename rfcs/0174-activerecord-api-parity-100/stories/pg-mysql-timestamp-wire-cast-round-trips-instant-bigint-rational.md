---
title: "activerecord: the pg/mysql2 timestamp wire cast round-trips Instant, BigInt and Rational per column"
status: ready
updated: 2026-10-10
rfc: "0174-activerecord-api-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#8413 moved timestamp conversion to the driver boundary: the pg and
mysql2 type parsers build a Ruby `Time` for every timestamp column of every
row through `timeFromInstant`
(`packages/activerecord/src/connection-adapters/abstract/temporal-wire.ts`),
called from `postgresql/temporal-type-parsers.ts` (`OID_TIMESTAMP`,
`OID_TIMESTAMPTZ`) and `mysql/temporal-type-cast.ts`.

That made the record-found arm of `authenticate_by` slower than the not-found
arm and turned `SecurePasswordTest > authenticate_by takes the same amount of
time regardless of whether record is found`
(`packages/activerecord/src/secure-password.test.ts`, Rails
`vendor/rails/v8.0.2/activerecord/test/cases/secure_password_test.rb`) red on
`Active Record PostgreSQL Tests (1)` (story `red-f17d8b20`). trails#8421 took
`Time#getutc` from ~60 us to ~4 us by porting it as MRI's
`time_gmtime(time_dup(time))` (`vendor/ruby/v3.3.11/time.c:4291-4294`), which
brought `timeFromInstant` from ~105 us to ~19 us per column.

What is left in `timeFromInstant` is a round trip:

- `value.epochNanoseconds` converts the polyfill's JSBI value to a `BigInt`
  through a string.
- `new Rational(ns, 1_000_000_000n)` reduces it, and `Time.at` multiplies it
  back to nanoseconds (`numExact(time).mul(1_000_000_000)`,
  `packages/date/src/time.ts`).
- `Time.#timeNewTimew` calls `Temporal.Instant.fromEpochNanoseconds`, building
  the `Instant` the function started with, and seats a local-zone
  `ZonedDateTime` that `getutc` / `getlocal` then replaces.

The wire parse before it (`parsePostgresTimestampAsInstant`) costs another
~12 us per column, most of it in the polyfill's ISO string parser.

The timing test was already marginal before trails#8413: of the four green
`main` runs before it, two needed a second `retryFlakyTest` attempt. Local
medians of found-minus-not-found over 1000 iterations on PostgreSQL 17:
0.23 s before trails#8413, 0.54 s at `f17d8b20`, 0.39 s after trails#8421,
against the test's 0.5 s tolerance.

Related: `temporal-wire-parsers-fold-into-the-oid-and-type-cast-bodies` owns
moving these parsers into the OID and type-cast bodies. If that story lands
first, do this work there.

## Acceptance criteria

- A timestamp column's wire text becomes a `Time` without building a
  `Temporal.Instant`, a `BigInt` and a `Rational` that are each converted
  straight back. Rails' drivers hand over a `Time` directly
  (`PG::TextDecoder::TimestampUtc` / `TimestampLocal`, mysql2's
  `database_timezone`).
- No new public surface on `packages/date` without a Ruby counterpart.
- The found-minus-not-found median for `authenticate_by` on PostgreSQL is back
  at or below its pre-trails#8413 value. State the measured numbers in the PR
  body.
- The test and its 0.5 s delta are not changed.
