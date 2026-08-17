---
title: "BigIntegerType#castValue should follow String#to_i, and inherit Integer#serialize"
status: done
updated: 2026-08-17
rfc: "0105-ar-deps-test-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: 6660
claim: "2026-08-17T17:48:13Z"
assignee: "call-mismatches-partial-regen-invents-phantom-rows"
blocked-by: null
closed-reason: null
---

## Context

`BigIntegerType#castValue` (`packages/activemodel/src/type/big-integer.ts`) answers
`null` for a string with no leading digits, and says so in a comment that is now
stale:

    // Unlike Ruby to_i, non-numeric strings return null rather than 0
    // — consistent with IntegerType's parseInt/NaN → null path.

That justification no longer holds. PR #6642 converged `IntegerType#castValue` to
Ruby's `value.to_i rescue nil` (`activemodel/lib/active_model/type/integer.rb:90`),
where `String#to_i` answers **0** when there are no leading digits — verified on
MRI 3.3: `"bad".to_i == 0`, `"bad1".to_i == 0`, `"12abc".to_i == 12`. Rails'
`BigInteger < Integer` (`activemodel/lib/active_model/type/big_integer.rb:8`)
inherits that `cast_value` unchanged, so MRI's BigInteger answers 0 too.

So `BigIntegerType` now diverges both from Rails and from its own superclass:
`IntegerType.cast("bad")` is `0` while `BigIntegerType.cast("bad")` is `nil`.

Converged shape: the string arm answers `0n`-equivalent (`0`) where the leading
digit run is absent, matching `String#to_i`, keeping the existing `narrowBigInt`
handling for the digits-present case (a bignum past float64's safe range must stay
exact).

Second, smaller item in the same file: `BigIntegerType#serialize` is overridden as
`return this.cast(value)`. Rails' `big_integer.rb` overrides only
`serialize_cast_value` and `max_value` — `serialize` is inherited from
`Integer#serialize` (integer.rb:65-68), which opens with the
`non_numeric_string?` guard and then `ensure_in_range(super)`. The override
bypasses both. `max_value` being `Float::INFINITY` makes the range check a no-op,
so the observable difference today is only the guard; PR #6642 added that guard to
`IntegerType#serialize`, which this override now shadows. Delete the override and
let inheritance do it, as Rails does.

## Acceptance criteria

- `BigIntegerType#castValue`'s string arm matches `String#to_i`: no leading digit
  run answers 0, not nil; digits-present behaviour and `narrowBigInt` unchanged.
- The stale comment is replaced with the Rails citation.
- `BigIntegerType#serialize` is deleted so `Integer#serialize` (integer.rb:65-68)
  is inherited, matching `big_integer.rb`.
- `pnpm parity:api` / `pnpm parity:test` deltas non-negative; `pnpm parity:api:calls`
  and `pnpm parity:api:calls:args` clean.
- Exercise the adapter lanes: a bigint column's `sum`/`deserialize` path is where
  this type is reached from a driver value (see #6642, where an analogous nil made
  every PG/MariaDB sum report 0 while SQLite stayed green).
