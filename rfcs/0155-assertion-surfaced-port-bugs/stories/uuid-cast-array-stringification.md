---
title: "uuid-cast-array-stringification"
status: claimed
updated: 2026-09-25
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: null
claim: "2026-09-25T16:51:41Z"
assignee: "generated-environments-omit-namespaced-framework-settings"
blocked-by: null
closed-reason: null
---

## Context

Surfaced converging `acceptable uuid regex` (`packages/activerecord/src/adapters/postgresql/uuid.test.ts`). Rails `uuid_test.rb:161-175` asserts `UUIDType.new(guid: ["A0EEBC99-9C0B-4EF8-BB6D-6BB9BD380A11"]).guid` is nil.

Rails `oid/uuid.rb:28-31` does `value.to_s` — Ruby `Array#to_s` is `inspect` (`["A0EE..."]`), which fails ACCEPTABLE_UUID. trails `connection-adapters/postgresql/oid/uuid.ts:28` uses `String(value)`, which for a one-element array yields the bare uuid, so cast returns the formatted string, not null. Cause verified by reading both; fix not attempted. Other invalid inputs in the list were not confirmed locally (PG excluded from local vitest).

## Acceptance criteria

`Uuid#cast` of a one-element array returns null; unskip `acceptable uuid regex`.
