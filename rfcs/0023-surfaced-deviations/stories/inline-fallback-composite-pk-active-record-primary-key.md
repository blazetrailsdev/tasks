---
title: "loadHasMany/loadHasOne inline fallback: replicate composite_primary_key? branch of active_record_primary_key"
status: ready
updated: 2026-06-17
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 25
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Follow-up surfaced reviewing PR #3525
(`loadhasmany-no-reflection-fallback-query-constraints-owner-key`, RFC 0023).

PR #3525 made the inline no-reflection fallback branches in `loadHasMany` /
`loadHasOne` (`packages/activerecord/src/associations.ts`, helper
`_inlineOwnerKey`) resolve a composite owner key from the owner's
query_constraints, mirroring `reflection.rb:587 active_record_primary_key`.

`_inlineOwnerKey` replicates the `custom_primary_key` and
`has_query_constraints? || options[:query_constraints]` branches of Rails'
`active_record_primary_key` (reflection.rb:587-603) but NOT the
`composite_primary_key?` branch (reflection.rb:597-600):

```ruby
elsif active_record.composite_primary_key?
  primary_key = primary_key(active_record)
  primary_key.include?("id") ? "id" : primary_key.freeze
```

The `!Array.isArray(primaryKey)` guard means a composite-PK owner (without
query_constraints) passes through `_inlineOwnerKey` unchanged — the inline
fallback never collapses a `[tenant_key, id]` composite PK to `"id"` the way
the reflection-routed path does. This is a pre-existing gap (the branch was
absent before #3525) and only affects the no-reflection lower-level API, but
it is an inconsistency with `reflection.activeRecordPrimaryKey`.

## Acceptance criteria

- [ ] `_inlineOwnerKey` (or the loadHasMany/loadHasOne inline fallbacks)
      replicate the `composite_primary_key?` branch of
      `active_record_primary_key`: for a composite-PK owner without
      query_constraints, infer `"id"` when the PK array includes `"id"`,
      else the full composite PK.
- [ ] A no-reflection test with a composite-PK owner of shape
      `[tenant_key, id]` keys correctly via the inferred `"id"`.
