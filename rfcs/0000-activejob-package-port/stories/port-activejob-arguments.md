---
title: "Port ActiveJob::Arguments, Serializers and ObjectSerializer (non-GlobalID arms)"
status: draft
updated: 2026-09-29
rfc: "0000-activejob-package-port"
cluster: null
packages: ["activejob"]
deps:
  [
    "port-activejob-namespace-and-base",
    "port-ruby-compat-ruby2-keywords-hash-flag",
    "register-activejob-constants-for-class-name-round-trip",
  ]
deps-rfc: []
est-loc: 400
priority: 3
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/activejob/lib/active_job/arguments.rb` (197 lines): `DeserializationError` (`:10-14`),
`SerializationError < ArgumentError` (`:26`), `Arguments` with `extend self`
(`:28-29`), `serialize` / `deserialize` (`:34-46`), the reserved keys
(`:50-67`) and `private_constant` (`:68-69`), `serialize_argument`
(`:71-108`), `deserialize_argument` (`:110-127`), `custom_serialized?`,
`serialize_hash`, `deserialize_hash`, `serialize_hash_key`,
`serialize_indifferent_hash` and `transform_symbol_keys` (`:137-188`).

`serializers.rb` (70 lines): the `Serializers` namespace with `Autoload`
(`:9-21`), `mattr_accessor :_additional_serializers` initialised to a `Set`
(`:23-24`), `serialize` / `deserialize` / `serializers` / `add_serializers`
(`:30-57`), and the default registration (`:60-68`), which the two serializer
stories fill. `serializers/object_serializer.rb` (55 lines): `ObjectSerializer`
with `include Singleton`, class-level `delegate :serialize?, :serialize,
:deserialize, to: :instance` (`:27-31`), and `serialize?` / `serialize` /
`deserialize` / `klass` (`:34-52`).

The GlobalID arms (`:85-86`, `:117-118`, `:129-135`, `:190-195`) are
`port-activejob-globalid-argument-arm`, filed and ordered after this story.
Do not add a receipt for them.

Tests: none of its own. `argument_serialization_test.rb` and
`serializers_test.rb` are ported by their test stories.

## Fidelity traps (predicted at authoring)

- [ ] **Symbol keys are observable here.** `_aj_symbol_keys` (`:92`) is persisted job data and tests assert it. Decide the Ruby-Symbol key representation under CLAUDE.md's `symbolize_keys` rule, write the decision at `serialize_argument`, and make the round trip restore exactly the key spelling the caller passed. `RESERVED_KEYS` includes both spellings of each key (`:61-67`), `"_aj_globalid"` and the Symbol form.
- [ ] **ruby2_keywords.** `Hash.ruby2_keywords_hash?(argument)` (`:93`) and `Hash.ruby2_keywords_hash(result)` (`:155`) go through `port-ruby-compat-ruby2-keywords-hash-flag`.
- [ ] **Integers include `bigint`.** `when nil, true, false, Integer, Float` (`:73`) must accept a JS `bigint` (the data list has `1_000_000_000_000_000_000_000`).
- [ ] **`argument.class == String`** (`:76`): a primitive string is the fast arm; a `String` object (a JS `String` subclass instance) goes through `Serializers.serialize` and falls back to itself on `SerializationError`.
- [ ] **`respond_to?`.** `argument.respond_to?(:permitted?) && argument.respond_to?(:to_h)` (`:102`) is `rbObjRespondTo`, never a `typeof x.m === "function"` probe, which the call gate reads as a call.
- [ ] **Truthiness.** `if symbol_keys = result.delete(SYMBOL_KEYS_KEY)` (`:151`) takes the branch for an empty array (`[]` is truthy in Ruby); test `!= null`, not length. `if result.delete(WITH_INDIFFERENT_ACCESS_KEY)` (`:149`) is `!= null && !== false`.
- [ ] **Bare `rescue` around async work.** `deserialize` rescues `StandardError` into `DeserializationError` (`:44-45`), and `DeserializationError#initialize` reads `$!` for message and backtrace (`:12-13`). The rescue must catch an awaited rejection, keep the original as `cause`, and not wrap a non-`StandardError`.
- [ ] **`key.inspect`** in both hash-key messages (`:163`, `:167`) is `rbInspect`, so a Symbol key renders `:foo`.
- [ ] **Singleton.** `ObjectSerializer`'s class-level `serialize?` / `serialize` / `deserialize` delegate to `instance`; `Serializers.serialize` calls them on the class (`serializers.rb:31`). Keep the delegation shape rather than instantiating per call.
- [ ] **`_additional_serializers +=`** (`serializers.rb:56`) replaces the `Set` rather than mutating it, and `detect` (`:31`) is insertion-ordered: custom serializers registered later are tried after the defaults.
- [ ] **`OBJECT_SERIALIZER_KEY` is not private** (it is missing from `private_constant`, `:68-69`) because `serializers.rb:40` reads `Arguments::OBJECT_SERIALIZER_KEY`; the other four keys are private.

## Acceptance criteria

- [ ] `arguments.rb` (less the four GlobalID members), `serializers.rb` and `object_serializer.rb` read complete in `parity:api`.
- [ ] Every error class and message string matches Rails byte for byte (`"Can only deserialize primitive arguments: …"`, `"Only string and symbol hash keys may be serialized as job arguments, but … is a …"`, `"Can't serialize a Hash with reserved key …"`, `"Unsupported argument type: …"`, `"Serializer name is not present in the argument: …"`, `"Serializer … is not known"`).
- [ ] `Arguments.deserialize` returns a promise; `serialize` does not.

## Definition of done

A `@missingRailsCall` receipt for the GlobalID arm, or a sync `deserialize`, does not close this story.
