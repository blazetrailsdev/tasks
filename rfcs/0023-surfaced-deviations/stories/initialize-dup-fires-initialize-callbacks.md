---
title: "initializeDup must fire the initialize callback chain (core.rb#initialize_dup)"
status: done
updated: 2026-07-14
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 4860
claim: "2026-07-14T01:22:37Z"
assignee: "initialize-dup-fires-initialize-callbacks"
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/activerecord/lib/active_record/core.rb:553` — `initialize_dup`
fires `_run_initialize_callbacks` (same as `initialize` at core.rb:481 and
`init_with_attributes` at core.rb:516-517). In trails, no `initializeDup` port
fires the `initialize` callback: `packages/activerecord/src/base.ts` (and the
`initializeDup` sites in `aggregations.ts`, `timestamp.ts`, `optimistic.ts`,
`connection-adapters/schema-cache.ts`) never call `runCallbacks("initialize")`
— grepped `packages/activerecord/src` for `runCallbacks("initialize")` /
`runAllCallbacks(..., "initialize")`, zero hits. So `after_initialize` /
`before_initialize` callbacks do not fire when a record is duplicated via
`dup`, diverging from Rails.

Surfaced by the `rails-callback-invocations` ESLint rule (PR #4853): the 4
`initializeDup` sites are currently grandfathered in
`eslint/rails-callback-invocations-exclude.json`.

## Acceptance criteria

- `Base#initializeDup` (the model-level dup path) fires the `initialize`
  callback chain, matching `core.rb#initialize_dup`.
- A test mirroring Rails' `after_initialize` firing on `dup` (see
  `vendor/rails/activerecord/test/cases/callbacks_test.rb` /
  `dup_test.rb` for the canonical after_initialize-on-dup coverage).
- Remove the now-passing `initializeDup` entries from
  `eslint/rails-callback-invocations-exclude.json` (the ratchet shrinks).
