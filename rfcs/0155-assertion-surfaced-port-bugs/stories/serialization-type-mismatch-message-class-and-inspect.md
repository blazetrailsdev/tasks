---
title: "SerializationTypeMismatch message: Ruby class name and inspect rendering"
status: claimed
updated: 2026-09-25
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: "2026-09-25T14:51:41Z"
assignee: "reset-callbacks-test-helper-ships-in-production-callbacks"
blocked-by: null
closed-reason: null
---

## Context

`packages/activerecord/src/coders/column-serializer.ts:61-69` (`assertValidValue`) builds the SerializationTypeMismatch message as `... but was a ${object.constructor?.name}. -- ${String(object)}`.

Rails `activerecord/lib/active_record/coders/column_serializer.rb:49` uses `#{object.class}` and `#{object.inspect}`, so a Hash reads `was a Hash. -- {zomg: true}`. trails prints `Object` and `[object Object]`.

The port in `serialized-attribute.test.ts` ("unexpected serialized type", mirroring `serialized_attribute_test.rb:327-338`) therefore asserts the trails-spelled string (`was a Object`, `${{ zomg: true }}`) rather than Rails' text. The test was converged on assertion kinds only in trails#7880.

## Acceptance criteria

- The message uses a Ruby-class name for the value (Hash for a plain object, Array for arrays) and an `inspect`-style rendering of it.
- The "unexpected serialized type" tests assert Rails' exact string.
