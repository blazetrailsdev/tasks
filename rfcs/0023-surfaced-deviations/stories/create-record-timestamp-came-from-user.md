---
title: "create-record-timestamp-came-from-user"
status: done
updated: 2026-06-20
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 3699
claim: "2026-06-20T03:02:43Z"
assignee: "create-record-timestamp-came-from-user"
blocked-by: null
---

## Context

trails' create path leaves `updated_at`/`created_at` as cast values rather than
user-written values: after `Model.create`, `cameFromUser("updated_at")` is
`false` and `readAttributeBeforeTypeCast("updated_at")` returns the raw DB string
(e.g. `"2026-06-19 11:45:20.406520"`), whereas Rails keeps the create-time
timestamp as the user-written Time (`came_from_user?` true, before_type_cast is
the Time object). See `packages/activerecord/src/timestamp.ts:301-314`
(`_createRecord` writes via `_writeAttribute`) — in Rails `_write_attribute`
routes through `@attributes.write_from_user`, marking came_from_user true.

Surfaced by the cacheVersion fast path (story
cache-version-fast-path-raw-timestamp, PR adding the fast path): Rails'
`cache_key_test.rb` test "cache_version calls updated_at when the value is
generated at create time" asserts (via `assert_called`) that the reader IS
invoked at create time, because the value is user-sourced. trails takes the fast
path instead (no reader call), so that test cannot observe the call distinction
and asserts value-equivalence with a tracked-divergence comment in
`packages/activerecord/src/cache-key.test.ts`.

## Acceptance criteria

- [ ] After `Model.create`, timestamp columns written by the timestamp callback
      report `cameFromUser` true and `readAttributeBeforeTypeCast` returns the
      assigned value (not the serialized DB string), matching Rails.
- [ ] The cacheVersion fast path is NOT taken for a freshly created record, so
      `cache_version calls updated_at when the value is generated at create time`
      can faithfully assert (via a spy) that the `updated_at` reader is called;
      drop the tracked-divergence comment in cache-key.test.ts.

## Definition of done

A freshly created record's framework-assigned timestamps are user-sourced
(came_from_user true), so cacheVersion calls the reader at create time, matching
Rails `integration.rb` + `cache_key_test.rb`.
