---
title: "converge-relation-subfile-model-accessor-reads"
status: claimed
updated: 2026-07-25
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-07-25T21:34:52Z"
assignee: "converge-relation-subfile-model-accessor-reads"
blocked-by: null
closed-reason: null
---

## Context

Sibling of `converge-relation-model-accessor-reads`, which converged
`relation.ts` only (LOC budget). Same infidelity, same rule.

Rails' `Relation` never reads `@model` outside `initialize`
(`vendor/rails/activerecord/lib/active_record/relation.rb:85`) — every other
read goes through the `model` accessor, and `klass` is just
`alias :klass :model` (relation.rb:73). trails reaches past it to the private
`_modelClass` field, so ported bodies omit a call Rails makes. `model` is a
plain accessor (`packages/activerecord/src/relation.ts:6242`), so each rewrite
is value-identical and behavior-preserving; the win is call-graph fidelity.

Remaining wide-ratchet `model`/`klass` entries live in
`scripts/api-compare/call-mismatches-wide-exclude/activerecord/relation/`:

- `query-methods.json` — `arel_column`, `arel_column_with_table`,
  `arel_column_aliases_from_hash`, `build_join_buckets`, `build_select`,
  `build_where_clause`, `build_with_join_node`, `construct_join_dependency`,
  `order_column`, `preprocess_order_args`, `sanitize_order_arguments`,
  `table_name_matches?`
- `calculations.json` — `all_attributes?`, `execute_grouped_calculation`
  (both `model` and `klass`), `execute_simple_calculation`,
  `type_cast_pluck_values`, `type_for`
- `finder-methods.json` — `_order_columns`, `find_one`, `find_some_ordered`,
  `find_with_ids`, `ordered_relation`, `raise_record_not_found_exception!`
- `merger.json` — `merge_joins`, `merge_outer_joins`, `merge_select_values`,
  `replace_from_clause?` (`merge_preloads` is already per-entry verified)
- `batches.json` — `act_on_ignored_order`, `batch_on_unloaded_relation`,
  `ensure_valid_options_for_batching!`

Not every `this._modelClass` occurrence is an infidelity: some sit in
trails-invented helpers with no Rails counterpart, and some correspond to
Rails bodies reading the `table` attr_reader rather than `model`. Check each
against its Rails body — a blanket sed would be wrong.

## Acceptance criteria

- Each `this._modelClass` read in `packages/activerecord/src/relation/*.ts` is
  checked against its Rails counterpart body; those whose Rails body reads the
  `model` (or `klass`) accessor are routed through `this.model` / `this.klass`,
  the rest are left alone and noted in the PR body.
- Reseed with `pnpm api:calls:wide:reseed`; `pnpm api:calls:wide` stays green
  and the baseline does not grow. Revert unrelated reseed churn (the reseed
  rewrites `attribute-methods.json` for unicode-escaping reasons only).
- Behavior-preserving: no test changes expected.
- 500 LOC ceiling; split by file if needed.
