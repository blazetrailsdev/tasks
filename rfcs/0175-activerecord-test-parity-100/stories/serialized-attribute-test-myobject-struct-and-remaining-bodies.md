---
title: "activerecord: serialized-attribute tests pass MyObject as a Struct type and the remaining bodies match Rails"
status: closed
updated: 2026-10-14
rfc: "0175-activerecord-test-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 600
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "FALSIFIED: the LOC ceiling was waived on trails#8879, which ported the Struct MyObject, the Psych safe paths and every remaining body itself"
---

## Context

`serialized-attribute-test-bodies-match-rails-arguments-and-assertions` converged the structure of
`packages/activerecord/src/serialized-attribute.test.ts`: `type: Hash` is ruby-compat's `Hash`
(`ColumnSerializer#assertValidValue` is `rbObjIsKindOf`, `object_class.new` is `rbClassNewInstance`),
the file defines its own `SerializedAttributeTest::Topic`, `ImportantTopic` and `ClassifiedTopic`
(`vendor/rails/v8.0.2/activerecord/test/cases/serialized_attribute_test.rb:23-33`), the two JSON null
tests insert through `lease_connection.insert` (`:136,146`), and the safe-load "serialized attribute"
tests use `type: String` (`:593,687`). The PR stopped at its LOC ceiling. What is left:

- `MyObject` is still a class with JSON `dump` / `load` passed as `coder:`. Rails has
  `MyObject = Struct.new :attribute1, :attribute2` passed as `type:` (`:21,43,57,215-219,303`).
  A `Struct.new` class was tried and fails at the coder:
  `YAMLColumn::SafeCoder` (`packages/activerecord/src/coders/yaml-column.ts`) calls the raw
  `yamlStringify` / `yamlParse` backend where Rails calls `YAML.dump` / `YAML.safe_dump` /
  `YAML.unsafe_load` / `YAML.safe_load`
  (`vendor/rails/v8.0.2/activerecord/lib/active_record/coders/yaml_column.rb`), so a Struct dumps as
  `{}`. ruby-compat's Psych port has no `visit_Struct`
  (`vendor/ruby/v3.3.11/ext/psych/lib/psych/visitors/yaml_tree.rb:168`) and no `!ruby/struct` revive
  arm in `to-ruby.ts` either.
- "should raise exception on serialized attribute with type mismatch" (`:214-220`) saves a plain hash
  and declares `type: Array`; Rails saves a `MyObject` and declares `type: Hash`.
- Most bodies still read through `as any` and re-`find` where Rails calls `reload`, and several skip
  an assertion or reorder lines against Rails.
- Still `it.skip`: "serialized class attribute" and "serialized class does not become frozen"
  (`:174-189`; `ClassifiedTopic` is now defined, Psych already has `visitClass` and `!ruby/class`),
  "serialize attribute via select method when time zone available" (`:301-311`),
  "classes without no arg constructors are not supported" (`:367-371`),
  "is not changed when stored blob" and "is not changed when stored in blob frozen payload"
  (`:383-414`), the two `EncryptedType` tests (`:454-515`),
  "serialized attribute works under concurrent initial access" (`:550-576`), and
  "supports permitted classes for default column serializer" (`:695-699`).
- The safe-load tests "serialized attribute with default" and "on custom attribute with default"
  (`:603-630`) declare `attribute "content", "text"` where Rails passes no type.

## Acceptance criteria

- [ ] `YAMLColumn::SafeCoder#dump` / `#load` call Psych's `dump` / `safeDump` / `unsafeLoad` /
      `safeLoad` as `yaml_column.rb` does, and Psych dumps and revives a `Struct`.
- [ ] `MyObject` is `Struct.new("attribute1", "attribute2")` and is passed as `type:`.
- [ ] Each remaining test body is the Rails body line for line, with no `as any`.
- [ ] Each remaining `it.skip` is ported, or carries a `PERMANENT-SKIP:` citing the CLAUDE.md section
      that rules it out.
- [ ] Test names unchanged; `pnpm parity:test:assertions` stays green.
