---
title: "assertions-activemodel-attributes-and-types-remainder"
status: done
updated: 2026-08-15
rfc: "0105-ar-deps-test-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6572
claim: "2026-08-15T18:00:01Z"
assignee: "assertions-activemodel-attributes-and-types-remainder"
blocked-by: null
closed-reason: null
---

## Context

Split out of `assertions-activemodel-attributes-and-types` (RFC 0105). That
story's PR converged six `activemodel` files to 0 assertion-count / -kind /
-value mismatches — `type/boolean_test.rb`, `type/value_test.rb`,
`type/date_test.rb`, `type/immutable_string_test.rb`,
`type/big_integer_test.rb`, `type/time_test.rb` — and lowered
`scripts/test-compare/assertion-mismatch-mark.json` for activemodel from
473/707/96 to 466/699/94.

The remaining files in the original table are still divergent. Re-measure with:

    pnpm parity:test -- --assertions --missing --package activemodel

Files still open (count/kind/value as of that PR's baseline measurement):

| Rails test file                     | count | kind | value |
| ----------------------------------- | ----: | ---: | ----: |
| `attribute_methods_test.rb`         |    15 |   18 |    11 |
| `attribute_test.rb`                 |    13 |   23 |     6 |
| `attribute_set_test.rb`             |    15 |   23 |     4 |
| `attribute_registration_test.rb`    |    15 |   21 |     3 |
| `dirty_test.rb`                     |    15 |   21 |     1 |
| `attributes_dirty_test.rb`          |    13 |   18 |     1 |
| `type/integer_test.rb`              |     8 |   12 |     2 |
| `attributes_test.rb`                |     7 |   10 |     1 |
| `attribute_assignment_test.rb`      |     5 |    7 |     1 |
| `type/decimal_test.rb`              |     5 |    8 |     0 |
| `type/serialize_cast_value_test.rb` |     0 |   10 |     1 |
| `type/date_time_test.rb`            |     3 |    3 |     1 |
| `access_test.rb`                    |     3 |    3 |     0 |
| `type/string_test.rb`               |     3 |    3 |     0 |
| `type/float_test.rb`                |     3 |    3 |     0 |
| `type/registry_test.rb`             |     3 |    3 |     0 |
| `type/binary_test.rb`               |     1 |    2 |     0 |
| `type_test.rb`                      |     1 |    1 |     0 |

Four of these are blocked on a **port** divergence, not a loose assertion —
converging the assertions alone would red the test. Each needs the
implementation fixed first (or a separate story for it):

- `type/binary_test.rb` — Rails `Binary#cast` (activemodel
  `lib/active_model/type/binary.rb:20-27`) returns non-String values
  untouched (`assert_equal 1, type.cast(1)`); trails
  `packages/activemodel/src/type/binary.ts:17-22` coerces every non-null value
  through `TextEncoder.encode(String(value))`. Rails also asserts
  `Encoding::BINARY` on the result and `assert_not_equal "ƒée", type.cast(...)`,
  which has no JS counterpart for a `Uint8Array`.
- `type/float_test.rb` — Rails asserts Ruby `String#to_f` semantics
  (`type.cast("1ignore") == 1.0`, `type.cast("bad") == 0.0`,
  `test/cases/type/float_test.rb:15-18`); trails `FloatType.cast` returns
  `null` for a non-numeric string. `test_changing_float` also needs
  `Float#changed?` with a `BigDecimal` NaN arm.
- `type/registry_test.rb` and `type_test.rb` — Rails `Registry#register`
  takes a **class** (`registry.rb:15-20`, `proc { |_, *args| klass.new(*args) }`)
  and `#lookup(symbol, ...)` forwards varargs/kwargs
  (`registry.rb:22-30`). trails `TypeRegistry`
  (`packages/activemodel/src/type/registry.ts:52-60`) has only the block arm
  and a single `options` parameter, so `registry.lookup(:bar, 2, :a)` cannot be
  expressed. The registry also raises `Unknown type: ${name}` where Rails raises
  `Unknown type :foo` (`registry.rb:28`) — AR's
  `type/adapter-specific-registry.ts:185` already uses the Rails message, so AM
  is the outlier.
- `access_test.rb` — Rails' test defines a bespoke `Point` that
  `include ActiveModel::Access`; trails has `slice`/`valuesAt` on `Model`
  (`packages/activemodel/src/model.ts:2584-2605`) with no standalone mixin, and
  `slice` returns a plain object rather than a `HashWithIndifferentAccess`, so
  the Rails `actual[key.to_s]` / `actual[key.to_sym]` pair collapses to one
  assertion.

`type/string_test.rb` has a genuine language shortcoming to note at the call
site rather than converge: Rails `assert_not_same s, type.cast(s)` asserts the
cast String is a fresh object; JS string primitives make `Object.is` always
true, so `notSame` cannot hold.

The Minitest primitives the ported assertions need are already in place from the
first PR: `assertPredicate`, `assertSame`, `assertNotSame` in
`packages/activesupport/src/testing/assertions.ts` (exported from the package
index alongside `assert` / `assertNot`), each tagged `@noRailsEquivalent
PERMANENT`.

## Acceptance criteria

- Each file taken on reports 0 assertion-count, 0 assertion-kind and 0
  assertion-value mismatches in
  `pnpm parity:test -- --assertions --package activemodel`.
- `scripts/test-compare/assertion-mismatch-mark.json` is lowered by exactly this
  story's contribution; never raised, never lowered by narrowing a report scope.
- No test name changes; `pnpm parity:test` percent for activemodel does not drop.
- No new rows in `scripts/parity/unported-files/`.
- Where a port divergence blocks the assertion port, fix the port (citing the
  Rails `file:line`) or file it as its own story and skip that file here —
  do not loosen the Rails side.
- If the remainder is still larger than one PR, ship what fits and file the rest
  as a further sibling story under this RFC.
