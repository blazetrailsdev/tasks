---
title: "converge-class-level-call-rows-surfaced-by-level-keyed-bodies"
status: claimed
updated: 2026-09-22
rfc: "0156-parity-beyond-name-presence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-09-22T14:49:45Z"
assignee: "block-parameter-parity-check"
blocked-by: null
closed-reason: null
---

## Context

Keying Ruby bodies on (owner, level, name) (trails#7936, `key-expected-set-on-level-and-name`) pairs each class-level row with its OWN Rails body. Before, the instance body stood in for both levels, which hid two call omissions on the class side:

- `ActiveRecord::AttributeMethods::ClassMethods#attribute_names` (`vendor/rails/activerecord/lib/active_record/attribute_methods.rb:236-242`) calls `table_exists?`. The port, `classAttributeNames` (`packages/activerecord/src/attribute-methods.ts:596`, exposed as `ClassMethods.attributeNames`), reads `cachedTableExists` instead.
- `ActiveRecord::Timestamp::ClassMethods#current_time_from_proper_timezone` (`vendor/rails/activerecord/lib/active_record/timestamp.rb:79-81`) reads `with_connection { |c| c.default_timezone }`. The port (`packages/activerecord/src/timestamp.ts:93`) reads the global `isUtc()`.

Both rows are baselined in `scripts/api-compare/call-mismatches-exclude/activerecord/{attribute-methods,timestamp}.json` with a reason that cites this story.

## Acceptance criteria

- Each body makes the call Rails makes (`table_exists?`, `with_connection`), or carries a `@missingRailsCall … — PERMANENT` receipt citing the CLAUDE.md section that ratifies the shape (e.g. "Schema reflection peeks at a warm cache").
- Both baseline rows are deleted, and the call-mismatch marks are tightened.
