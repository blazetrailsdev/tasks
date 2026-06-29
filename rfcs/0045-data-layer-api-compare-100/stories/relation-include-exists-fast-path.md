---
title: "relation-include-exists-fast-path"
status: claimed
updated: 2026-06-29
rfc: "0045-data-layer-api-compare-100"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: 3
pr: null
claim: "2026-06-29T20:23:39Z"
assignee: "relation-include-exists-fast-path"
blocked-by: null
---

## Context

`Relation#include?` (and its `alias :member? :include?`) in Rails
(`activerecord/lib/active_record/relation/finder_methods.rb:389-407`) has a
three-branch body:

1. `return false unless record.is_a?(model)` — non-model input short-circuits.
2. If `loaded? || offset_value || limit_value || having_clause.any?` →
   `records.include?(record)` (in-memory comparison).
3. Otherwise (unloaded, no offset/limit/having) → build the record's id
   (composite-PK aware) and run `exists?(id)` — an efficient existence query
   that avoids loading the whole relation.

trails' `include` (`packages/activerecord/src/relation.ts:6247`) currently
**always loads** and compares in memory:

```ts
async include(record: T): Promise<boolean> {
  const records = await this.toArray();
  return records.some((r) => r.isEqual(record));
}
```

`member` (added in PR #4051) aliases this, so both public names share the
divergence. Correctness is equivalent for the common path (a non-model arg
still yields false via isEqual), but trails issues a full load where Rails
issues a cheap `exists?` — an N-row materialization vs a single existence query
on large unloaded relations.

## Acceptance criteria

- Port `include`/`member` to Rails' branch structure:
  - non-model input returns `false` without querying;
  - loaded relations (or those with offset/limit/having) compare in memory;
  - unloaded relations without offset/limit/having call `exists?(id)` with a
    composite-PK-aware id (mirroring `record.class.composite_primary_key?`).
- `member` stays a thin alias of `include` (Rails `alias :member? :include?`).
- relation/finder_methods.rb stays at 100% api:compare; no test:compare
  regression (add/port the Rails `test_include?` / `test_member?` coverage if
  not already present).
