---
title: "enum min/max aggregate returns string key instead of Rails integer"
status: claimed
updated: 2026-07-02
rfc: "0050-enum-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: "2026-07-02T15:21:51Z"
assignee: "enum-min-max-deserialize-in-aggregates"
blocked-by: null
---

## Context

Surfaced in calculations.test.ts:1744 during RFC 0019 canonical-schema burndown (PR #4211).

`calculations.ts:castAggValue` calls `colType.deserialize(val)` for `minimum`/`maximum` aggregates (coerceNumeric=false path). When the column type is an `EnumType`, `EnumType#deserialize` in trails returns the string key ("easy", "medium"), but Rails' `EnumType#deserialize` returns the raw integer (0, 1).

Rails test (`calculations_test.rb:1505-1506`):

```ruby
assert_equal 0, Book.minimum(:difficulty)   # integer, not "easy"
assert_equal 1, Book.maximum(:difficulty)   # integer, not "medium"
```

Trails returns: `"easy"`, `"medium"` (string keys via `EnumType#deserialize`).

Same deviation in grouped aggregates (`group(:status).minimum(:difficulty)` → `{ "proposed" => 0, ... }` in Rails vs `{ "proposed" => "easy", ... }` in trails).

Documented in calculations.test.ts with comment:

> trails deviation: Rails EnumType#deserialize for min/max returns the raw integer (0, 1), but trails' EnumType#deserialize returns the string key ("easy", "medium"). Tracked as enum-min-max-deserialize convergence.

## Acceptance criteria

- `Book.minimum(:difficulty)` returns `0` (integer), not `"easy"` (string)
- `Book.maximum(:difficulty)` returns `1` (integer), not `"medium"` (string)
- `Book.group(:status).minimum(:difficulty)` returns `{ "proposed" => 0, "published" => 0 }` (integers)
- `Book.group(:status).maximum(:difficulty)` returns `{ "proposed" => 0, "published" => 1 }` (integers)
- `calculations.test.ts` "aggregate attribute on enum type" deviation comments removed; assertions use exact integer values
- Root fix is in `EnumType#deserialize` or in `castAggValue`'s coerceNumeric=false path — whichever is more faithful to Rails
