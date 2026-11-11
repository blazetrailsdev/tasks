---
title: "save-chain-cold-record-detector-misses-tables-without-primary-key"
status: draft
updated: 2026-11-11
rfc: "0189-activerecord-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`save` / `saveBang` (`packages/activerecord/src/transactions.ts`) await `ensureSchemaLoaded` and then reverse-merge `_defaultAttributes` into a new record that was built while the schema was cold. Rails never needs this step: `Core#initialize` (vendor/rails/v8.0.2/activerecord/lib/active_record/core.rb:471-482) reads `_default_attributes`, and `load_schema` (model_schema.rb) runs synchronously. The arm decides a record was built cold by checking `isNewRecord() && !_attributes.isKey(primaryKey)`. A table with no primary key never meets that condition, so a record built cold on such a table saves without its column defaults. The check is a guess at "built cold" (trails#9997 review).

## Acceptance criteria

- A record built cold on a table with no primary key gets its column attributes at save.
- The detector checks a fact the constructor records (that the record was built against an unloaded schema), not whether the primary-key key is present.
- The `@inventedArm if — CONVERGEABLE` receipt on save/saveBang becomes PERMANENT or is removed.
