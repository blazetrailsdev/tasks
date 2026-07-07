---
title: "big-integer-safe-range-number-representation"
status: claimed
updated: 2026-07-07
rfc: "0056-adapter-type-column-reflection-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: 24
pr: null
claim: "2026-07-07T00:08:52Z"
assignee: "big-integer-safe-range-number-representation"
blocked-by: null
closed-reason: null
---

## Context

Supersedes `integer-type-bigint-fk-pk-coercion-pg` (PR #4530, closed unmerged). That
story tried to fix `child.fk === parent.id` cross-adapter mismatch by normalizing the
`id` **accessor** (`getId` + `readPkWith` in
`packages/activerecord/src/attribute-methods/primary-key.ts`) to collapse a safe-range
`bigint` to `number`. CI (PG **and** MariaDB) proved that approach unviable: it flips
only the `.id`/`idWas`/`idInDatabase` accessors while every _other_ id-producing path
(`pluck`, collection `ids`, raw `_readAttribute` of the PK column) still yields `bigint`.
That desyncs paired comparisons across ~20 tests in files the PR never touched —
`has-many-associations.test.ts`, `has-many-through-associations.test.ts`,
`associations.test.ts`, etc. — e.g. `expected [ 1n, 2n ] to deeply equal [ 1, 2 ]`,
`expected [ 868201481n ] to deeply equal [ 868201481 ]`, `expected 17n to be 17`.

Root cause is one layer down, in the type primitive. PR #783 ("bigint PR 1 — driver
normalization") deliberately kept **safe-range auto-increment PKs as `number`** on
better-sqlite3 (safeIntegers gated to bigint columns) and mysql2 (`supportBigNumbers`,
number for < ~15 digits), but left **pg unchanged**: pg-types returns int8 as a decimal
string, and `BigIntegerType.cast/deserialize` turns it into `bigint` unconditionally
(`packages/activemodel/src/type/big-integer.ts:26-44`). MariaDB via mysql2 exhibits the
same bigint result for these columns. So pg/MariaDB never got the "safe-range integer is
a JS `number`" contract the other adapters already honor.

Because a bigint PK column feeds _all_ id paths through the same `BigIntegerType`, fixing
the type (not the accessor) flips every path together and preserves the symmetry the
deeply-equal assertions depend on.

Rails source: Ruby has a single unbounded `Integer`; `id`, `id_before_type_cast`,
`id_was`, `id_in_database` are all mirrors of the same value
(`activerecord/lib/active_record/attribute_methods/primary_key.rb:18-51`);
`active_model/type/integer.rb#cast_value` is `.to_i`. There is no number/bigint split in
Rails — trails introduced it for values beyond `Number.MAX_SAFE_INTEGER`.

## Acceptance criteria

- `BigIntegerType.castValue` **and** the deserialize path return a JS `number` for values
  within `[Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER]`, and `bigint` only for
  values outside that range (preserving precision for genuine bignums / OOR ids).
- `cast` and `deserialize` agree on representation for the same logical value (no spurious
  dirty-tracking: assigning a `number` after a DB load of the same value must not mark the
  attribute changed).
- On pg and MariaDB, a default `bigint` PK, `pluck("id")`, collection `ids`, and an
  `integer` FK holding the same value are all `number` and compare `===` / `toEqual`.
- The 31 `Number()` wrappers on `child.fk`/`parent.id` comparisons in
  `autosave-association.test.ts` can be removed and all three CI adapters stay green.
- Update the `big-integer.test.ts` assertions that currently expect `bigint` for
  safe-range values (e.g. `cast("42") === 42n`) to the new `number` contract — **keep the
  Rails-verbatim test names**, change only the expected values. Audit the whole suite for
  other `typeof x === "bigint"` / `[Nn]` assertions on safe-range values and converge them.
- Preserve the genuine-bignum tests: `bigint-roundtrip.test.ts` (score = 2^62 stays
  `bigint`), unboundable-bignum predicate threading, pg `checkIntInRange` guards.

## Notes / risks

- This reverses PR #783's "bigint for cast" choice for safe-range values, but _aligns_
  with its stated cross-adapter intent ("safe-range PKs remain numbers"). Flag it as a
  deliberate representation convergence in the PR body.
- Only reproducible on pg/MariaDB — verification is CI-driven, expect iteration.
- Likely exceeds the accessor PR's ~60 LOC once suite-wide bigint assertions are converged;
  keep within the 500-LOC ceiling or split the test-convergence follow-ups into their own
  stories.
