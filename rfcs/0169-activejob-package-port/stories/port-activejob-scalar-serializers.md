---
title: "Port SymbolSerializer, ModuleSerializer, RangeSerializer, BigDecimalSerializer and DurationSerializer"
status: draft
updated: 2026-09-29
rfc: "0169-activejob-package-port"
cluster: null
packages: ["activejob"]
deps: ["port-activejob-arguments"]
deps-rfc: []
est-loc: 300
priority: 3
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Five `ObjectSerializer` subclasses under `vendor/rails/v8.0.2/activejob/lib/active_job/serializers/`, each seated on
`Serializers` and registered by `serializers.rb:60-68`:

- `symbol_serializer.rb` (`klass` `Symbol`): `serialize` stores `argument.to_s`
  (`:6-8`), `deserialize` returns `argument["value"].to_sym` (`:10-12`).
- `module_serializer.rb` (`klass` `Module`): raises
  `SerializationError, "Serializing an anonymous class is not supported"`
  unless `constant.name` (`:6-9`); `deserialize` is `hash["value"].constantize`
  (`:11-13`).
- `range_serializer.rb` (`klass` `::Range`): `KEYS = %w[begin end exclude_end]`
  (`:6`), `serialize` runs `Arguments.serialize([begin, end, exclude_end?])`
  (`:8-11`), `deserialize` is `klass.new(*Arguments.deserialize(…))` (`:13-15`).
- `big_decimal_serializer.rb` (`klass` `BigDecimal`): `to_s` / `BigDecimal(…)`
  (`:8-14`) over `packages/ruby-compat/src/big-decimal.ts:29`.
- `duration_serializer.rb` (`klass` `ActiveSupport::Duration`): stores
  `duration.value` and `Arguments.serialize(duration.parts)` (`:6-10`),
  rebuilds with `klass.new(value, parts.to_h)` (`:12-17`).

## Fidelity traps (predicted at authoring)

- [ ] **Symbol = `":name"` string.** `serialize?` matches a string starting with `":"`; `serialize` stores the name without the colon; `deserialize` returns `":" + value`. A plain string never reaches this serializer because `serialize_argument`'s `when String` arm catches it first (`arguments.rb:75-84`).
- [ ] **Anonymous classes.** `constant.name` is `nil` for `Class.new` in Ruby, but a JS class expression assigned to a variable gets an inferred `name`. Use the Ruby-name reader from `register-activejob-constants-for-class-name-round-trip`: unregistered means anonymous.
- [ ] **`exclude_end?` is a predicate** on `Range` (`isExcludeEnd`), and endless/beginless ranges serialize `nil` ends.
- [ ] **`RangeSerializer#deserialize` awaits** `Arguments.deserialize`, so `ObjectSerializer#deserialize` returns `T | Promise<T>` and `deserialize_argument` awaits the custom arm.
- [ ] **`BigDecimal#to_s` is Ruby's format** (`BigDecimal(5).to_s == "0.5e1"`); check ruby-compat's `toS` matches MRI before relying on it.
- [ ] **`Duration#parts` is dense in trails where Rails' is sparse and ordered.** `duration.parts` feeds persisted job data, so a dense `parts` hash serializes zero-valued units Rails omits. Converge `parts` (activesupport) or serialize only the non-zero units Rails would have, and cite which.

## Acceptance criteria

- [ ] All five files read complete in `parity:api`, and each class is seated and resolvable by its full Ruby name.
- [ ] A `.trails.test.ts` round-trips one value of each type through `Arguments.serialize` / `await Arguments.deserialize`; the Rails coverage lands with the test stories.

## Definition of done

Modelling a Ruby Symbol as a JS `Symbol`, or a `SymbolSerializer` that matches every string, does not close this story.
