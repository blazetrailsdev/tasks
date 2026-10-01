---
title: "activerecord: serialized-attribute tests call Topic.serialize as Rails does, not ~40 invented Topic subclasses"
status: draft
updated: 2026-10-01
rfc: "0175-activerecord-test-parity-100"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 400
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by trails#8336, which deleted `findStiClassForRow` and so required every STI subclass to be a
registered constant.

`vendor/rails/v8.0.2/activerecord/test/cases/serialized_attribute_test.rb` declares each serializer on
`Topic` itself — `Topic.serialize("content", type: MyObject)` (`:43`), `Topic.serialize :content, coder: JSON`
(`:111,119,132,143`), `Topic.serialize(:content, type: Hash)` (`:202-252`) — and restores it in
`teardown` with `Topic.serialize("content")` (`:14-17`). Only `ImportantTopic` and `ClassifiedTopic`
(`:27-35`) are real subclasses.

`packages/activerecord/src/serialized-attribute.test.ts` instead defines about 40 test-local
subclasses (`class JsonTopic extends Topic`, `HashTopic`, `FlexTopic`, `ArrayTopic`, `AliasTopic`,
`CoderTopic`, …), one per test and several names repeated. Each is an STI subclass, so its rows are
written with `type: "JsonTopic"` where Rails writes a plain `Topic` row, and trails#8336 had to add a
`registerModel(X)` after each so those rows can be read back. The registrations leak into the global
constant table for the rest of the worker.

## Acceptance criteria

- [ ] Each test body calls `Topic.serialize(...)` where the Rails test does, word for word; the invented subclasses and their `registerModel` calls are deleted.
- [ ] The Rails `teardown` (`Topic.serialize("content")`, `serialized_attribute_test.rb:14-17`) is ported so the declaration does not leak between tests.
- [ ] Test names unchanged; `pnpm parity:test:assertions` stays green.
- [ ] `pnpm vitest run packages/activerecord/src/serialized-attribute.test.ts` green on SQLite, PostgreSQL and MySQL.

## Verification

```bash
pnpm vitest run packages/activerecord/src/serialized-attribute.test.ts && pnpm parity:test:assertions
```
