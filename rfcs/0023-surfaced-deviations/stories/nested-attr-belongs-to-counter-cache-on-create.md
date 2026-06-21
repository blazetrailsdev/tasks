---
title: "nested-attr-belongs-to-counter-cache-on-create"
status: in-progress
updated: 2026-06-21
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 3791
claim: "2026-06-21T13:34:42Z"
assignee: "nested-attr-belongs-to-counter-cache-on-create"
blocked-by: null
---

## Context

The belongsTo create branch of `processNestedAttributes`
(`packages/activerecord/src/nested-attributes.ts:~359`) persists the owner's
foreign-key columns with a direct `UpdateManager` / `executeMutation`, bypassing
the normal belongs_to assignment. As a result, when the belongs_to declares
`counterCache: true`, the target's counter column is never incremented for a
nested-attributes create.

Rails routes the create through `BelongsToAssociation#replace_keys` plus
`save_belongs_to_association` (activerecord/lib/active_record/associations/
belongs_to_association.rb), and the belongs_to counter-cache machinery
(`update_counters` on the target) bumps the count when the owner gains its FK.
trails' nested-attributes belongsTo flush is a trails-specific deferred path
that writes the FK columns directly and so misses the counter increment.

This is pre-existing — it predates the single→composite FK generalization in
PR #3787 (it affected the single-key path too). Surfaced during review of #3787:
`CpkBook belongs_to :order` is declared `counterCache: true` against
`cpk_orders.books_count`, but a nested create of the order leaves `books_count`
at its default.

## Acceptance criteria

- A nested-attributes belongsTo create whose reflection declares
  `counterCache: true` increments the target's counter column (e.g.
  `cpk_orders.books_count`), matching Rails.
- Works for both single-column and composite (CPK) belongs_to.
- Single-column / non-counter-cache belongsTo nested creates unchanged; no
  regressions in test:compare / api:compare.
- Add a regression test asserting the counter column is bumped after the nested
  create.
