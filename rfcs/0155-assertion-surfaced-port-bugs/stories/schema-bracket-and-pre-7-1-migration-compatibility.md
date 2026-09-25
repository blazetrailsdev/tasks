---
title: "schema-bracket-and-pre-7-1-migration-compatibility"
status: done
updated: 2026-09-25
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: ["migration-compatibility-v6-1-for-pre-rails-7-dump-tests"]
deps-rfc: []
est-loc: 60
priority: null
pr: trails#8087
claim: "2026-09-25T14:51:41Z"
assignee: "reset-callbacks-test-helper-ships-in-production-callbacks"
blocked-by: null
closed-reason: null
---

## Context

Surfaced parking `active_record_schema_test.rb` for `park-0155-owned-activerecord-residue`.
Two production gaps red the converged bodies of `schema without version is the current version schema`
and `schema version accessor` (`packages/activerecord/src/active-record-schema.test.ts:67-80`;
Rails `vendor/rails/activerecord/test/cases/active_record_schema_test.rb:37-48`):

1. `Migration::Compatibility` stops at `V7_1`. Rails defines `V7_0`, `V6_1`, `V6_0`, `V5_2`, `V5_1`,
   `V5_0`, `V4_2` (`vendor/rails/activerecord/lib/active_record/migration/compatibility.rb:40-416`),
   so `Migration.get(7.0)` / `Migration.get(6.1)` raise `ArgumentError: Unknown migration version "7.0"`
   in trails (`packages/activerecord/src/migration/compatibility.ts:15`).
2. `Schema.get` (`packages/activerecord/src/schema.ts:65-73`, Rails `ActiveRecord::Schema.[]`,
   `schema.rb:70-75`) throws `TypeError: Cannot read properties of undefined (reading 'has')`:
   the `private static _classForVersion?` field declaration makes `Object.hasOwn(this, "_classForVersion")`
   true with an `undefined` value, so the `||= {}` arm never initializes the map.

## Acceptance criteria

- `Schema.get` memoizes per version as `schema.rb:70-75` does.
- The missing `Compatibility::V*` classes are ported from `compatibility.rb` (may be split into follow-up stories by version).
- Both tests in `active-record-schema.test.ts` are un-skipped and pass.
