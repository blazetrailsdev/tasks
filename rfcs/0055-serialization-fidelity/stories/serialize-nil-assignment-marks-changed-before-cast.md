---
title: "serialized nil assignment marks attribute changed before cast (Rails: not dirty)"
status: claimed
updated: 2026-07-07
rfc: "0055-serialization-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: 49
pr: null
claim: "2026-07-07T13:37:52Z"
assignee: "serialize-nil-assignment-marks-changed-before-cast"
blocked-by: null
---

## Context

`packages/activerecord/src/serialized-attribute.test.ts` — `nil is not changed when serialized with a class` (line ~313).

Rails: `Topic.new(content: nil).content_changed?` → `false`. nil casts to the coder default (`[]` for Array serializer), so the attribute is never marked dirty.

Trails: `new ArrayTopic({ content: null }).attributeChanged("content")` → `true`. Explicit nil assignment marks the attribute changed before the Serialized type's cast can coerce nil to the default value.

The test currently only asserts the no-explicit-nil case (`new ArrayTopic()` — no argument) and documents the explicit-nil deviation with a comment. The test name is deliberately preserved (Rails name).

Root location: `packages/activerecord/src/attribute.ts` or `packages/activerecord/src/attributes.ts` — attribute change detection runs before type casting in the trails write path.

## Acceptance criteria

- `new ArrayTopic({ content: null }).attributeChanged("content")` returns `false` (matches Rails)
- The explicit-nil guard in `serialized-attribute.test.ts` `nil is not changed when serialized with a class` can be removed (the deviation comment and `new ArrayTopic()` workaround → `new ArrayTopic({ content: null })`)
- No regression in other dirty-tracking tests
