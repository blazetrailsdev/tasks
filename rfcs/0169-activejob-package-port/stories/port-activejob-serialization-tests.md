---
title: "Port job_serialization_test.rb, serializers_test.rb and time_with_zone_serializer_test.rb (17 cases)"
status: draft
updated: 2026-09-29
rfc: "0169-activejob-package-port"
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
est-loc: 300
priority: 3
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Three small files about job data. `serializers_test.rb` defines `DummyValueObject` and `DummySerializer` (`:6-40`) and registers them under their Ruby names; it restores `Serializers._additional_serializers` in teardown.

Pure test port against already-ported lib code: keep every Rails name (a `def test_x` maps to `"x"`), port each assertion without loosening it, and build expected Ruby `inspect` text with `rbInspect`.

`vendor/rails/v8.0.2/activejob/test/cases/job_serialization_test.rb`: 9 cases, as `parity:test` names them:

- [ ] `:15` JobSerializationTest — "serialize job with gid"
- [ ] `:20` JobSerializationTest — "serialize includes current locale"
- [ ] `:24` JobSerializationTest — "serialize and deserialize are symmetric"
- [ ] `:41` JobSerializationTest — "deserialize sets locale"
- [ ] `:47` JobSerializationTest — "deserialize sets default locale"
- [ ] `:53` JobSerializationTest — "serialize stores provider_job_id"
- [ ] `:61` JobSerializationTest — "serialize stores the current timezone"
- [ ] `:68` JobSerializationTest — "serializes and deserializes enqueued_at with full precision"
- [ ] `:79` JobSerializationTest — "serializes and deserializes scheduled_at as Time"

`vendor/rails/v8.0.2/activejob/test/cases/serializers_test.rb`: 7 cases, as `parity:test` names them:

- [ ] `:43` SerializersTest — "can't serialize unknown object"
- [ ] `:49` SerializersTest — "will serialize objects with serializers registered"
- [ ] `:58` SerializersTest — "won't deserialize unknown hash"
- [ ] `:69` SerializersTest — "won't deserialize unknown serializer"
- [ ] `:80` SerializersTest — "will deserialize known serialized objects"
- [ ] `:86` SerializersTest — "adds new serializer"
- [ ] `:91` SerializersTest — "can't add serializer with the same key twice"

`vendor/rails/v8.0.2/activejob/test/serializers/time_with_zone_serializer_test.rb`: 1 case, as `parity:test` names them:

- [ ] `:6` TimeWithZoneSerializerTest — "#deserialize preserves serialized time zone"

## Fidelity traps (predicted at authoring)

- [ ] `"serializes and deserializes enqueued_at with full precision"` needs `iso8601(9)` end to end (`port-activejob-core`).

## Acceptance criteria

- [ ] All 17 cases listed above are ported under their Rails names and pass in every lane their `adapter_is?` guards allow.

## Definition of done

Renaming a test or weakening an assertion does not close this story. A case that fails on a lib bug is fixed in the same PR; if the fix is over budget, the case may be skipped only with a skip reason naming a story filed in this RFC for the bug.
