---
title: 'computeTableName: delete invented base === this → "" arm (model_schema.rb:606-620)'
status: claimed
updated: 2026-09-25
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: "2026-09-25T18:51:40Z"
assignee: "initialize-cache-skips-lookup-store-so-generated-cache-store-is-omitted"
blocked-by: null
closed-reason: null
---

## Context

`computeTableName` (`packages/activerecord/src/model-schema.ts`, around line 46) has an extra guard, `if (base === this) return "";`, in its STI arm. Rails' `compute_table_name` (`vendor/rails/activerecord/lib/active_record/model_schema.rb:606-620`) has no such arm: when `base_class?` is false it returns `base_class.table_name`, and `base_class?` is `base_class == self`, so the branches cannot disagree. The guard only fires when trails' `isBaseClass` and `baseClass` disagree. That hides a divergence between those two helpers and answers `""` where Rails would never reach this line. Seen while typing `tableName` as `string | null` in trails#8088.

## Acceptance criteria

- [ ] Delete the `base === this` arm, so `computeTableName` mirrors `model_schema.rb:606-620` branch for branch.
- [ ] If deleting it reds a test, fix the `isBaseClass` / `baseClass` disagreement it was masking (`inheritance.rb` `base_class?` / `base_class`), not the guard.
