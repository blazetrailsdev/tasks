---
title: "Port ActiveJob::Arguments, Serializers and ObjectSerializer (non-GlobalID arms)"
status: draft
updated: 2026-09-29
rfc: "0000-activejob-package-port"
cluster: null
packages: ["activejob"]
deps: ["enroll-activejob-in-compare-tooling"]
deps-rfc: []
est-loc: 500
priority: 3
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/activejob/lib/active_job/arguments.rb` (197 lines):

- `DeserializationError` (`:10-24`, which wraps `$!` as `cause`) and
  `SerializationError < ArgumentError` (`:26`);
- `Arguments.serialize` / `deserialize` (`:34-45`), `module_function`;
- the reserved keys (`:48-67`: `_aj_globalid`, `_aj_symbol_keys`,
  `_aj_ruby2_keywords`, `_aj_serialized`,
  `_aj_hash_with_indifferent_access`) and `private_constant` (`:68-69`);
- `serialize_argument` (`:71-108`), `deserialize_argument` (`:110-127`),
  `custom_serialized?`, `serialize_hash`, `deserialize_hash`,
  `serialize_hash_key`, `serialize_indifferent_hash` and
  `transform_symbol_keys` (`:137-188`).

`serializers.rb` (70 lines): `Serializers.serialize` / `deserialize` /
`serializers` / `add_serializers` (`:26-68`), `_additional_serializers`
(`:23`), and the `autoload` list (`:11-21`). `serializers/object_serializer.rb`
(55 lines): the `ObjectSerializer` base class with `serialize?`, `serialize`,
`deserialize` and the private `klass` (`:26-54`).

**The GlobalID arms are not in this story.** Those are `when
GlobalID::Identification` (`:85-86`), `serialized_global_id?` /
`deserialize_global_id` (`:117-118`, `:129-135`) and
`convert_to_global_id_hash` (`:190-196`). They belong to
`port-activejob-globalid-arguments-and-rescue-tests`, which is filed and
follows directly (RFC "GlobalID arguments"). Do not add a receipt for them.

**Shape decisions from the RFC:**

- `Arguments.deserialize` is **async** from this PR, because the GlobalID arm
  that lands next awaits `Locator.locate`. `serialize` stays sync.
- Ruby Symbol keys. `_aj_symbol_keys` records which keys were Symbols
  (`:92`). A JS object has one key type, so this is exactly the observable case
  where CLAUDE.md's `symbolize_keys` rule keeps the Symbol-ness: a Ruby Symbol
  value is a `":name"` string. Port the grep/transform over that spelling, and
  keep the `ruby2_keywords` arm (`:93-97`) as the kwargs discriminator trails
  already uses for Ruby kwargs.
- `when ActiveSupport::HashWithIndifferentAccess` is activesupport's
  `HashWithIndifferentAccess`. The `permitted?` / `to_h` duck-type arm
  (`:102-103`) uses `rbObjRespondTo`, never `typeof x.m === "function"`
  (`project_typeof_method_guard_reads_as_a_call_in_call_gate`).
- `argument.class == String` (`:76`) keeps the subclass arm: a String subclass
  goes through `Serializers.serialize`.

Tests: `test/cases/argument_serialization_test.rb`, every case except the
GlobalID ones (`:83-101`, `:256-260`) and the data-list case `:51-81`, which
needs the object serializers and goes to
`port-activejob-object-serializers`. That covers `:103-254`: deep arrays and
hashes, string and symbol keys, `ActionController::Parameters` through
`test/support/stubs/strong_parameters.rb`, String subclasses, hash
(de)serialization, indifferent access, and the reserved and non-primitive
key errors.

## Acceptance criteria

- [ ] `parity:api` reports `arguments.rb`, `serializers.rb` and
      `serializers/object_serializer.rb` complete, except the four GlobalID
      members named above.
- [ ] `argument_serialization_test.rb`'s non-GlobalID, non-data-list cases are
      ported under their Rails names and pass.
- [ ] Error classes and messages match Rails exactly (`"Can only deserialize
primitive arguments: …"`, `"Only string and symbol hash keys may be
serialized as job arguments, but …"`, and so on).
- [ ] `Arguments.deserialize` returns a promise.
