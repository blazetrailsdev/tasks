---
title: "wave-4c-ar-core-residue-model-c"
status: done
updated: 2026-08-19
rfc: "0106-wide-call-set-direct-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6735
claim: "2026-08-19T11:35:05Z"
assignee: "wave-4c-ar-core-residue-model-c"
blocked-by: null
closed-reason: null
---

# Wave 4c-b residue: the model-core call-set rows still open after PR for wave-4c-ar-core-residue-model-b

## Context

`wave-4c-ar-core-residue-model-b` converged 3 model-core `kind: "set"` rows and
left the rest. Re-measure on `origin/main` after that PR merges
(`pnpm build && API_COMPARE_FORCE=1 pnpm parity:api --calls`, then read
`scripts/api-compare/output/call-mismatches.json`) — every count below goes
stale as soon as a tooling PR lands.

What that PR shipped, so you do not redo it:

- `locking/optimistic.ts` `increment!` — ported as Rails' real override
  (`optimistic.rb:63-70`, `super.tap { ... clear_attribute_change }`), wired
  through `InstanceMethods` so `include()`'s last-wins ordering makes it beat
  `Persistence#increment!`. The trails-only `reflectLockVersionBump`
  (`associations.ts`) and its `belongs-to-association.ts` call site are deleted.
  This also required `ActiveModel::Dirty#clear_attribute_change` to actually
  forget the assignment (`attribute_mutation_tracker.rb:33-35`,
  `attributes[name] = attributes[name].forgetting_assignment`) — added as
  `AttributeSet#forgetAttributeAssignment` and called from
  `dirty.ts#clearAttributeChange`.
- `integration.ts` `cache_key` / `cache_version` — call activesupport's `toFs`
  instead of the hand-rolled `toFsUsec` / `toFsNumber` / `formatTimestamp`
  (`integration.rb:83`, `:105`). The receiver-as-argument-1 shape is baselined
  as two reviewed `kind: "args"` rows, matching the existing reviewed
  `relation.ts` `compute_cache_version` row.
- `integration.ts` `can_use_fast_cache_version? -> with_connection` now carries a
  reviewed per-site reason (async `withConnection` vs a sync predicate; Rails'
  own FIXME on `integration.rb:180-183` asks for exactly the global read trails
  does).

Still open (as measured at that PR's branch point):

    transactions.json    18  — 14 are the set_callback / set_options_for_callbacks!
                              family across before_commit / after_commit /
                              after_save|create|update|destroy_commit /
                              after_rollback. The module-level shims in
                              transactions.ts:166-306 re-dispatch to the Base
                              statics instead of porting
                              set_options_for_callbacks! + set_callback, so
                              neither Rails call is made. One receiver split
                              settles all 14. Rails: transactions.rb:250-340.
                              Big enough to be its own PR.
    core.json            16  — the find_by / find_by! statement-cache fast path
                              (core.rb:189-235) plus the connected_to stack
                              (connected_to_stack, current_role / current_shard /
                              current_preventing_writes, connection_class?,
                              preventing_writes?, generated_association_methods,
                              cached_find_by_statement). The find_by cluster is
                              its own PR.
    persistence.json      6  — reload→merge; _in_memory_query_constraints_hash→
                              attribute (persistence.rb:837-845, Rails calls the
                              private `attribute` reader, trails calls
                              readAttribute); instantiate→instantiate_instance_of
                              (persistence.rb:100-103); query_constraints_list→
                              base_class? (persistence.rb:223-229 — note Ruby `!=`
                              on the primary_key ARRAY is value equality, so a JS
                              `!==` on two composite-PK arrays is always true);
                              _insert_record→with_cast_value; _delete_record→
                              with_connection.
    base.json             3  — all→default_scoped / merge! (named.rb:22-33);
                              destroy→with_transaction_returning_status
                              (transactions.rb:356-358).
    querying.json         3  — _load_from_sql→inheritance_column / instantiate /
                              instantiate_instance_of.
    delegated-type.json   3
    scoping/default.json  3  — build_default_scope→any? / default_scope
                              (default.rb:145-170); scope_attributes?→any?.
    inheritance.json      2  — descends_from_active_record?→columns_hash (trails
                              uses the lazy-schema `classHasAttribute`);
                              discriminate_class_for_record→find_sti_class
                              (inheritance.ts:846-870 routes through the
                              autoloader-less `findStiClassForRow`).
    aggregations.json     1  — composed_of→include (Ruby `include Aggregations`;
                              trails spells it `includeAggregations`).
    autosave-association.json 1 — define_non_cyclic_method→define_method.

## Acceptance criteria

- [ ] Every row above is either converged (the TS body makes the call Rails
      makes, verified against the Rails source line) or leaves a reviewed
      one-line per-site reason / a `@missingRailsCall` tag at the call site.
      No widened allowlist, no new row.
- [ ] Rows deleted by hand via `serializeBaseline`, then
      `pnpm parity:api:calls:tighten <shard>` for each shard touched. No
      `--write`, no reseed, ever.
- [ ] `pnpm parity:api:calls` and `pnpm parity:api:calls:args` green.
- [ ] `pnpm parity:api:extra --package activerecord` shows no new novel surface.
- [ ] SQLite, PostgreSQL and MySQL/MariaDB lanes green.
- [ ] `pnpm build` before every `API_COMPARE_FORCE=1 pnpm parity:api --calls`.
- [ ] Split further if this will not fit the LOC ceiling; file the rest. The
      transactions set_callback family and the core find_by cluster are each
      large enough to be their own PR.
