---
title: "activejob-arguments-serialize-accepts-a-hash"
status: claimed
updated: 2026-10-17
rfc: "0156-parity-beyond-name-presence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 1
pr: null
claim: "2026-10-17T19:55:14Z"
assignee: "activejob-arguments-serialize-accepts-a-hash"
blocked-by: null
closed-reason: null
---

## Context

`ActiveJob::Arguments.serialize` / `.deserialize` map whatever Enumerable they
are given (`vendor/rails/v8.0.2/activejob/lib/active_job/arguments.rb:34-36`,
`:42-46`: `arguments.map { |argument| ... }`). Rails relies on that for a Hash:
`DurationSerializer#serialize` passes the bare `duration.parts` Hash
(`vendor/rails/v8.0.2/activejob/lib/active_job/serializers/duration_serializer.rb:8`,
"we continue passing the bare hash for backwards compatibility"), so `parts` is
serialized as an array of `[key, value]` pairs, which `deserialize` maps back
and `DurationSerializer#deserialize` turns into a Hash with `to_h`.

trails' hand port types both as arrays and calls JS `Array#map`
(`packages/activejob/src/arguments.ts:59` `serialize(arguments_: unknown[])`,
`:63` `deserialize(arguments_: unknown[])`), so a Hash argument throws
`arguments_.map is not a function`. Surfaced by the Ruby→TS codegen spike's port
of `argument_serialization_test.rb` ("serializes ActiveSupport::Duration - 1 day
verbatim", "should maintain a functional duration").

## Acceptance criteria

- `Arguments.serialize` and `Arguments.deserialize` take any Ruby Enumerable,
  as Rails' `arguments.map` does: an array, and a Hash (plain object, ruby-compat
  `Hash`, or `HashWithIndifferentAccess`) mapped over its `[key, value]` pairs.
- `DurationSerializer` round-trips `1.year` with its `parts`, matching the two
  Rails tests above.
- `deserialize` keeps its `rescue` → `DeserializationError` arm.
