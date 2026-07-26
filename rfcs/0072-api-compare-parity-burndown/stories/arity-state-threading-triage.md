---
title: "state-threading free functions: converge to this-typed hosts or exclude with reason"
status: in-progress
updated: 2026-07-26
rfc: "0072-api-compare-parity-burndown"
cluster: arity-fidelity
deps:
  [
    "arity-skip-ruby-delegate-entries",
    "arity-collapse-required-kwargs-into-options-object",
    "arity-resolve-ts-alias-bindings-to-target-params",
    "arity-exclude-mechanism",
  ]
deps-rfc: []
est-loc: 400
priority: 30
pr: 5340
claim: "2026-07-26T02:54:52Z"
assignee: "arity-state-threading-triage"
blocked-by: null
closed-reason: null
---

## Context

The largest remaining arity bucket: Ruby zero-arg private methods that read
instance state (`@predicates`, adapter flags, config ivars) ported as free
functions taking the state explicitly. From `output/arity-mismatches.json`
(activerecord, 2026-07-25):

- `relation/where_clause.rb` — `referenced_columns()`, `each_attributes()`,
  `except_predicates(columns)`, `predicates_with_wrapped_sql_literals()`,
  `non_empty_predicates()` vs TS free functions taking `predicates`
  (`packages/activerecord/src/relation/where-clause.ts`).
- `connection_adapters/mysql/schema_statements.rb:146,154` —
  `row_format_dynamic_by_default?()`, `default_row_format()` vs TS
  `(isMariaDb, databaseVersion, …)`.
- `insert_all.rb:129,145` — `configure_on_duplicate_update_logic()`,
  `custom_update_sql_provided?()` vs TS `(onDuplicate)`.
- `database_configurations/connection_url_resolver.rb:91`
  (`database_from_path`), `database_configurations/url_config.rb:69`
  (`build_url_hash`) vs TS `(path)` / `(url)`.
- `connection_adapters/schema_cache.rb:440`
  (`derive_columns_hash_and_deduplicate_values`) vs TS `(cache)`.
- `result.rb` `hash_rows()` vs TS `(rows, colIndexes)`.
- `connection_adapters/abstract/transaction.rb` — `unique_records()` vs
  `(recs)`; `run_action_on_records(records, instances)` vs
  `(records, instancesToRunCallbacksOn, action)`.
- `connection_adapters/mysql/database_statements.rb`
  `max_allowed_packet_reached?(current, previous)` vs `(…, maxPacket)`.
- `relation/delegation.rb` `include_relation_methods(delegate)` vs
  `(carrier, methods, priority)`.
- `connection_adapters/postgresql/oid/type_map_initializer.rb`
  `register_with_subtype(oid, target_oid)` vs `(oid, targetOid, build)`.
- `validations/uniqueness.rb` `validation_needed?` / `covered_by_unique_index?`
  vs TS with a leading `validator` param — candidate for adding `validator`
  to `RECEIVER_PARAM_NAMES` (`scripts/api-compare/arity.ts:75-111`) since it
  IS the Ruby receiver.
- `migration.rb` `run_without_lock()` vs `(direction, targetVersion)`.

For each: converge to the `this`-typed mixin convention (CLAUDE.md "Module
mixins") where a host interface exists or is cheap to add — that is the
faithful endgame; otherwise record it in the arity exclude
(arity-exclude-mechanism story) with a reason at the exclusion site. Where
the extra param is literally the Ruby receiver (uniqueness `validator`),
prefer extending the arity strip lists over excluding.

Likely several PRs; respect the 500-LOC ceiling by shipping per-file
clusters and registering follow-up stories for the remainder via
`pnpm tasks new` rather than fanning out PRs.

## Acceptance criteria

- Every listed entry is resolved one of three ways: converged to Rails'
  signature via `this`-typed state, covered by an extended strip-list rule
  (with test), or excluded with a written reason.
- Regenerated `output/arity-mismatches.json` shows 0 unexcluded activerecord
  entries from this list; the exclude file's entries each carry a reason.
- Touched test files pass; no test renames.
