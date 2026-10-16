---
rfc: "0000-activerecord-codegen-surfaced-convergence"
title: "Convergence findings from the activerecord Ruby → IR → TypeScript spike"
status: draft
created: 2026-10-16
updated: 2026-10-16
owner: "@deanmarano"
packages:
  - activerecord
  - activemodel
  - ruby-compat
clusters:
  - constant-map
  - concurrent-primitives
---

<!-- Unnumbered until merge: copy this dir to `rfcs/0000-your-slug`, keep `rfc:`
     as 0000-your-slug and the H1 below number-free. `scripts/finalize-rfc.mjs`
     swaps 0000 for the assigned number at merge. Never use a `draft-` prefix —
     `draft` is a lifecycle status, not a dir prefix (see top-level README). -->

# RFC — Convergence findings from the activerecord Ruby → IR → TypeScript spike

## Summary

The activerecord codegen spike (trails branch `spike-ar-ruby-ir-ts-29583a`,
report `scripts/codegen/FINAL-REPORT.md`) generated all 306 activerecord files
from `vendor/rails/v8.0.2/activerecord/lib` and type-checked them against the
real trails dependencies. Of the 827 remaining tsc errors, about 330 were filed
as "dependency surface differs from Rails". This RFC holds the subset of those
that, once checked against the hand port, are real convergeable gaps, and one
naming rule the owner ruled on while reviewing them: the `ActiveModel::Type`
classes keep their `Type` suffix, recorded in an explicit map.

## Motivation

Each error was checked against the hand-written file at the same Rails site.
Most did not survive:

- **Not a trails gap: flat exports.** About 80 errors were the generator reading
  a constant through its Rails namespace path (`ActiveModel::Type::Binary`,
  `ActiveSupport::MessagePack::Extensions`, `ActiveSupport::Concurrency::NullLock`,
  `ActiveModel::Validations::PresenceValidator`) where trails exports the class
  flat and the hand port imports it by name. For example `normalization.ts:112`
  calls `SerializeCastValue.serialize` exactly as `normalization.rb:140` does.
  That is a generator resolution problem, owned by the codegen RFC
  (`0185-ruby-ts-codegen`), and it needs the map below as input.
- **Not a trails gap: generator lowering.** Most call-shape errors (TS2554 /
  TS2353) were ruby-compat helper arities, un-camelCased kwarg keys and cascades
  from an unresolved `Type.String` superclass.
- **Real: the `<X>Type` names have no explicit record.** `ActiveModel::Type::String`
  is `StringType` because `String`, `Boolean`, `Date` and friends collide with JS
  globals. The parity tools match that through a fuzzy transform
  (`TS_PARENT_ALIASES`'s `` `${r}Type` `` and `` `Numeric${r}Type` ``,
  `scripts/api-compare/compare.ts:3170-3183`), which accepts ANY `FooType` as a
  port of ANY Ruby `Foo`, and a generator or reviewer has no table to read.
- **Real: concurrent-ruby primitives replaced by bare values.** Rails holds
  `Concurrent::AtomicBoolean` + `Concurrent::ReadWriteLock` in
  `AsynchronousQueriesTracker::Session` and `Concurrent::AtomicFixnum` as the
  pool's query-cache version. The hand port uses a boolean, a pass-through
  `synchronize`, and `{ value: number }`, and `Session#finalize(wait)` drops its
  wait-for-readers arm entirely.

Prior art checked (`grep -rl` over `rfcs/*/stories` for every constant above):
`extra-surface-cannot-see-the-x-type-alias-rule` (0134, done, trails#7506) made
`parity:api:extra` honour the fuzzy rule and is what this RFC replaces with a
table; `ruby-compat-concurrent-timer-task-and-atomic-fixnum` (0177, draft) ports
`AtomicFixnum` and is a dependency here; `weak-thread-key-map-prunes-through-hash-select-bang`
(0154, owner-parked) covers `WeakThreadKeyMap`, which is Rails' own fallback arm
(`connection_pool.rb:123-150`) and is not refiled.

## Design

### The `ActiveModel::Type` constant map

A table in `scripts/parity/conventions.ts`, keyed by the fully qualified Ruby
constant, giving the TS export name. Ruled by the repo owner on 2026-10-16: the
`Type` suffix stays, because the bare names collide in JS. Rows:

| Ruby constant                                              | TS export             |
| ---------------------------------------------------------- | --------------------- |
| `ActiveModel::Type::Value`                                 | `ValueType`           |
| `ActiveModel::Type::BigInteger`                            | `BigIntegerType`      |
| `ActiveModel::Type::Binary`                                | `BinaryType`          |
| `ActiveModel::Type::Boolean`                               | `BooleanType`         |
| `ActiveModel::Type::Date`                                  | `DateType`            |
| `ActiveModel::Type::DateTime`                              | `DateTimeType`        |
| `ActiveModel::Type::Decimal`                               | `DecimalType`         |
| `ActiveModel::Type::Float`                                 | `FloatType`           |
| `ActiveModel::Type::ImmutableString`                       | `ImmutableStringType` |
| `ActiveModel::Type::Integer`                               | `IntegerType`         |
| `ActiveModel::Type::String`                                | `StringType`          |
| `ActiveModel::Type::Time`                                  | `TimeType`            |
| `ActiveRecord::ConnectionAdapters::PostgreSQL::OID::Range` | `RangeType`           |

`parity:api`, `parity:api:extra` and the inheritance check read this table, the
fuzzy transforms are retired, and `docs/ruby-ts-conventions.md` gains the table
through its generator. The codegen resolver consumes the same table.

### Concurrent primitives

`Concurrent::AtomicBoolean` and `Concurrent::ReadWriteLock` are ported into
`packages/ruby-compat/src/concurrent/` beside `Map` and `CountDownLatch`, and
`AsynchronousQueriesTracker::Session` and the pool's `@query_cache_version` use
them at the Rails sites. A read lock in trails spans an `await`, the same
reasoning as § "The pool monitor guards only sections that span an `await`".

## Non-goals

- **Seating flat exports on Rails namespace objects** (`ActiveSupport.MessagePack`,
  `ActiveModel.Type.Binary`): trails imports by name, and § "Call-time constant
  resolution" sanctions a namespace seat only to break a cycle. The generator
  resolves through a map instead, in `0185-ruby-ts-codegen`.
- **Generator lowering defects** found in the same error set: tracked in the
  spike's `PROGRESS.md`, owned by `0185-ruby-ts-codegen`.
- **`WeakThreadKeyMap`**: Rails' own fallback class; owner-parked in 0154.

## Alternatives considered

- **Keep the fuzzy `<X>Type` transform:** it credits any `FooType` against any
  Ruby `Foo` and gives a reader no list. Rejected.
- **Drop the suffix and rename to Rails names:** the collisions with the `String`,
  `Boolean` and `Date` globals are why the suffix exists. Ruled
  out by the owner.

## Rollout

1. `active-model-type-constant-map`
2. `async-queries-session-atomic-boolean-and-read-write-lock`
3. `query-cache-version-is-an-atomic-fixnum` (after the 0177 `AtomicFixnum` port)

## Verification

- The fuzzy `` `${r}Type` `` / `` `Numeric${r}Type` `` transforms are gone, and
  `parity:api` methods, inheritance and `parity:api:extra` totals are unchanged
  or better.
- `parity:api:calls` shows no omitted `make_false` / `true?` / `with_read_lock` /
  `with_write_lock` / `increment` in `asynchronous_queries_tracker.rb` and
  `query_cache.rb`.

## Open questions

None.

## Changelog

- 2026-10-16: initial RFC, from the activerecord codegen spike.
