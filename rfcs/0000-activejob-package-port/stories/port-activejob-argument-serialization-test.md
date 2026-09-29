---
title: "Port argument_serialization_test.rb (20 cases)"
status: draft
updated: 2026-09-29
rfc: "0000-activejob-package-port"
cluster: null
packages: ["activejob"]
deps:
  [
    "port-activejob-scalar-serializers",
    "port-activejob-time-serializers",
    "port-activejob-globalid-argument-arm",
    "port-activejob-test-fixture-jobs",
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

`vendor/rails/v8.0.2/activejob/test/cases/argument_serialization_test.rb` (277 lines). Fixtures: `models/person`, `kwargs_job`, `arguments_round_trip_job`, `support/stubs/strong_parameters`; the `ModuleArgument` / `ClassArgument` constants (`:15-19`) are registered under their Ruby names.

Pure test port against already-ported lib code: keep every Rails name (a `def test_x` maps to `"x"`), port each assertion without loosening it, and build expected Ruby `inspect` text with `rbInspect`.

`vendor/rails/v8.0.2/activejob/test/cases/argument_serialization_test.rb`: 20 cases, as `parity:test` names them:

- [ ] `:78` ArgumentSerializationTest — "serializes - verbatim"
- [ ] `:84` ArgumentSerializationTest — "does not serialize "
- [ ] `:95` ArgumentSerializationTest — "should convert records to Global IDs"
- [ ] `:99` ArgumentSerializationTest — "should keep Global IDs strings as they are"
- [ ] `:103` ArgumentSerializationTest — "should dive deep into arrays and hashes"
- [ ] `:108` ArgumentSerializationTest — "should maintain string and symbol keys"
- [ ] `:112` ArgumentSerializationTest — "serialize a ActionController::Parameters"
- [ ] `:122` ArgumentSerializationTest — "serialize a class with permitted? defined"
- [ ] `:126` ArgumentSerializationTest — "serialize a String subclass object"
- [ ] `:139` ArgumentSerializationTest — "serialize a String subclass object without a serializer"
- [ ] `:147` ArgumentSerializationTest — "serialize a hash"
- [ ] `:166` ArgumentSerializationTest — "deserialize a hash"
- [ ] `:195` ArgumentSerializationTest — "should maintain hash with indifferent access"
- [ ] `:205` ArgumentSerializationTest — "should maintain time with zone"
- [ ] `:213` ArgumentSerializationTest — "should maintain a functional duration"
- [ ] `:219` ArgumentSerializationTest — "should disallow non-string/symbol hash keys"
- [ ] `:229` ArgumentSerializationTest — "should not allow reserved hash keys"
- [ ] `:240` ArgumentSerializationTest — "should not allow non-primitive objects"
- [ ] `:250` ArgumentSerializationTest — "allows for keyword arguments"
- [ ] `:256` ArgumentSerializationTest — "raises a friendly SerializationError for records without ids"

## Fidelity traps (predicted at authoring)

- [ ] The two parametrized cases (`:78` over the data list `:51-77`, `:84` over `[Object.new, Person.find("5").to_gid, Class.new]`) are one `parity:test` name each (`"serializes  -  verbatim"`, `"does not serialize "`, interpolation stripped); port them as one `it` per name that loops over every element, so a failing element names itself.
- [ ] `"serialize a String subclass object"` defines a `String` subclass with a custom serializer (`:126-137`); in TS that is a `String` object subclass, not a primitive.

## Acceptance criteria

- [ ] All 20 cases listed above are ported under their Rails names and pass in every lane their `adapter_is?` guards allow.

## Definition of done

Renaming a test or weakening an assertion does not close this story. A case that fails on a lib bug is fixed in the same PR; if the fix is over budget, the case may be skipped only with a skip reason naming a story filed in this RFC for the bug.
