---
title: "activerecord: serialized-attribute test bodies use Rails' serializer arguments, values and assertions"
status: ready
updated: 2026-10-13
rfc: "0175-activerecord-test-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 450
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#8816 moved every serializer declaration in `packages/activerecord/src/serialized-attribute.test.ts` onto `Topic.serialize(...)` and ported Rails' setup and teardown, but left the arguments and assertion bodies as they were. They still differ from `vendor/rails/v8.0.2/activerecord/test/cases/serialized_attribute_test.rb`:

- `type: Hash` is spelled `{ type: HashObject }`, a test-local class with a `Symbol.hasInstance` hook, in every test Rails writes `Topic.serialize(:content, type: Hash)` (`:92,103,202-262`).
- `MyObject` is a class with JSON `dump` / `load` passed as `coder:`, where Rails has `MyObject = Struct.new :attribute1, :attribute2` passed as `type:` (`:21,43`). "should raise exception on serialized attribute with type mismatch" (`:215-221`) saves a plain hash and then declares `type: Array`, where Rails saves a `MyObject` and declares `type: Hash`.
- "json read legacy null" and "json read db null" create a row and `UPDATE` it, where Rails inserts the row with `Topic.lease_connection.insert` (`:136,146`).
- `Topic` is the canonical `test-helpers/models/topic.ts`; Rails' file defines its own `SerializedAttributeTest::Topic < ActiveRecord::Base` with `serialize :content` (`:23-25`), and `ClassifiedTopic` (`:31-33`) is not defined at all.
- `afterAll(() => setUseYamlUnsafeLoad(false))` has no counterpart in Rails' teardown (`:14-17`).
- The file-level `vi.stubEnv("AR_NO_AUTO_SCHEMA", "1")` and the many `as any` casts are trails additions.

## Acceptance criteria

- [ ] Each test body in `serialized-attribute.test.ts` is the Rails body line for line: same serializer arguments, same values, same assertions, in the same order.
- [ ] `HashObject` is deleted; `type: Hash` is expressed the way the rest of the suite expresses it.
- [ ] The test-local `Topic`, `ImportantTopic` and `ClassifiedTopic` are defined as `serialized_attribute_test.rb:23-33` defines them.
- [ ] Any assertion that cannot be ported carries a receipt or a `PERMANENT-SKIP:` citing the CLAUDE.md section that rules it out.
- [ ] Test names unchanged; `pnpm parity:test:assertions` stays green on SQLite, PostgreSQL and MySQL.
