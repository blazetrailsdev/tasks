---
title: "Port the eleven ObjectSerializer subclasses and serializers_test.rb"
status: draft
updated: 2026-09-29
rfc: "0000-activejob-package-port"
cluster: null
packages: ["activejob"]
deps: ["port-activejob-arguments"]
deps-rfc: []
est-loc: 450
priority: 3
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/activejob/lib/active_job/serializers/` holds
`ObjectSerializer` (ported by `port-activejob-arguments`) and eleven
subclasses, which `serializers.rb:11-21` autoloads and `serializers.rb:60-68`
registers as defaults. Each one maps onto a type trails already has:

| Ruby file                      | `klass`                       | trails type                                                                                                 |
| ------------------------------ | ----------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `symbol_serializer.rb`         | `Symbol`                      | a `":name"` string (see below)                                                                              |
| `big_decimal_serializer.rb`    | `BigDecimal`                  | `BigDecimal`, `packages/ruby-compat/src/big-decimal.ts:29`                                                  |
| `duration_serializer.rb`       | `ActiveSupport::Duration`     | `packages/activesupport/src/duration.ts`                                                                    |
| `time_with_zone_serializer.rb` | `ActiveSupport::TimeWithZone` | `packages/activesupport/src/time-with-zone.ts`                                                              |
| `time_object_serializer.rb`    | (abstract, `:5-11`)           | base for the three below                                                                                    |
| `date_serializer.rb`           | `Date`                        | `Date`, `packages/date/src/date.ts:4468`                                                                    |
| `date_time_serializer.rb`      | `DateTime`                    | `DateTime`, `packages/date/src/date.ts:5805`                                                                |
| `time_serializer.rb`           | `Time`                        | `Time`, `packages/date/src/time.ts:400`                                                                     |
| `module_serializer.rb`         | `Module`                      | a JS class. `constant.name` and `hash["value"].constantize` (`:6-13`) through activesupport's `constantize` |
| `range_serializer.rb`          | `::Range`                     | `Range`, `packages/ruby-compat/src/range.ts:76`                                                             |

If activesupport does not re-export them, add `@blazetrails/date` to
`packages/activejob/package.json`.

**The Symbol serializer follows the colon-string rule.** A Ruby Symbol is a JS
string that keeps its leading colon (CLAUDE.md § "Ruby idioms that do not
translate literally"). So `SymbolSerializer#serialize?` matches a string that
starts with `":"`, `serialize` stores `argument.to_s`, which is the name
without the colon (`symbol_serializer.rb:6-8`), and `deserialize` returns
`":" + value` (`:10-12`). A plain string never reaches this serializer:
`Arguments.serialize_argument`'s `when String` arm (`arguments.rb:75-84`)
catches it first. Make that ordering explicit in a test.

**`RangeSerializer#deserialize` re-enters `Arguments.deserialize`**
(`range_serializer.rb:12-14`), which is async (RFC "Async shape"). So
`Serializers.deserialize` and `ObjectSerializer#deserialize` may return a
promise, and `Arguments.deserialize_argument` awaits the custom arm. A
user-defined serializer may still be sync. Type the base method
`T | Promise<T>`.

Tests:

- `test/cases/serializers_test.rb`: all 7 cases.
- `test/serializers/time_with_zone_serializer_test.rb`: 1 case.
- `test/cases/argument_serialization_test.rb:51-81`, the data-list case
  `"serializes #{arg.class} - #{arg.inspect} verbatim"`, over the full list,
  including `1_000_000_000_000_000_000_000` (a `bigint`), the endless and
  beginless ranges, and `ModuleArgument` / `ClassArgument` (`:15-19`). Also
  `"should maintain time with zone"` (`:205-211`) and `"should maintain a
functional duration"` (`:213-217`).

## Acceptance criteria

- [ ] All eleven subclass files read complete in `parity:api`.
- [ ] `serializers_test.rb` (7) and `time_with_zone_serializer_test.rb` (1)
      pass under their Rails names.
- [ ] The data-list case round-trips every element of `:51-77`.
- [ ] A Symbol argument round-trips as `":a"`, and a string `"a"` stays a
      string.

## Definition of done

Modelling a Ruby Symbol as a JS `Symbol` does not close this story, and neither does a `SymbolSerializer` that matches every string.
