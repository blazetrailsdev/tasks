---
title: "wave-4c-ar-core-residue-model-b"
status: done
updated: 2026-08-19
rfc: "0106-wide-call-set-direct-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6732
claim: "2026-08-18T23:35:11Z"
assignee: "wave-4c-ar-core-residue-model-b"
blocked-by: null
closed-reason: null
---

# Wave 4c-a residue: the model-core call-set rows not converged by PR for wave-4c-ar-core-residue-model

## Context

`wave-4c-ar-core-residue-model` measured 79 `kind: "set"` rows across the
model-core shards of
`scripts/api-compare/call-mismatches-exclude/activerecord/**` and converged 19
of them (no-touching 3, normalization 1, aggregations 1, persistence 8,
inheritance 5) inside the 700 LOC ceiling. This story carries the remainder.

Re-measure against `origin/main` after that PR merges; as measured there the
residue is:

    transactions.json           18   (14 of them the set_callback /
                                      set_options_for_callbacks! family across
                                      before_commit / after_commit /
                                      after_save|create|update|destroy_commit /
                                      after_rollback — one receiver split
                                      settles all 14 at once; the TS
                                      module-level `afterCommit(modelClass, fn,
                                      options)` shims in transactions.ts:166-306
                                      re-dispatch to the Base statics instead of
                                      porting set_options_for_callbacks! +
                                      set_callback, so neither Rails call is
                                      made. Rails: transactions.rb:250-340.)
    core.json                   16   (find_by / find_by! statement-cache fast
                                      path — core.rb:189-235 — plus the
                                      connected_to stack: connected_to_stack,
                                      current_role/current_shard/
                                      current_preventing_writes,
                                      connection_class?, preventing_writes?,
                                      generated_association_methods,
                                      cached_find_by_statement.)
    persistence.json             6   reload→merge; _in_memory_query_constraints_hash
                                      →attribute (persistence.rb:837-845, Rails
                                      calls the private `attribute` reader, trails
                                      calls readAttribute); instantiate→
                                      instantiate_instance_of (persistence.rb:100-103;
                                      trails' `_instantiate` takes a 4th
                                      `overrideTypes` map the private helper's
                                      Rails-shaped signature has no slot for);
                                      query_constraints_list→base_class?
                                      (persistence.rb:223-229; note Ruby `!=` on
                                      the primary_key ARRAY is value equality —
                                      a JS `!==` on two composite-PK arrays is
                                      always true); _insert_record→with_cast_value;
                                      _delete_record→with_connection.
    inheritance.json             2   descends_from_active_record?→columns_hash
                                      (trails uses the lazy-schema
                                      `classHasAttribute`); discriminate_class_for_record
                                      →find_sti_class (trails routes through the
                                      autoloader-less `findStiClassForRow`
                                      degradation path, inheritance.ts:846-870).
    base.json                    3   all→default_scoped/merge!; destroy→
                                      with_transaction_returning_status.
    querying.json                3   _load_from_sql→inheritance_column /
                                      instantiate / instantiate_instance_of.
    integration.json             3   cache_key→to_fs; cache_version→to_fs;
                                      can_use_fast_cache_version?→with_connection
                                      (integration.rb:72-111, 178-186; trails'
                                      integration.ts:29-62 hand-rolls
                                      `toFsUsec`/`toFsNumber` instead of calling
                                      the ActiveSupport `to_fs`).
    delegated-type.json          3
    scoping/default.json         3   build_default_scope→any?/default_scope;
                                      scope_attributes?→any?.
    aggregations.json            1   composed_of→include (Ruby `include
                                      Aggregations`; trails spells it
                                      `includeAggregations`).
    locking/optimistic.json      1   increment!→clear_attribute_change. The TS
                                      `incrementBang` in locking/optimistic.ts:95
                                      is Persistence#increment! re-ported into
                                      the locking file and DROPS the whole
                                      locking arm Rails adds there
                                      (optimistic.rb:63-70: `super.tap { if
                                      locking_enabled? ... clear_attribute_change }`).
                                      This is a real bug, not a naming row.
    autosave-association.json    1   define_non_cyclic_method→define_method.

## Acceptance criteria

- [ ] Every row listed above is either converged (the TS body makes the call
      Rails makes, verified against the Rails source line) or leaves a reviewed
      one-line per-site reason / a `@missingRailsCall` tag at the call site. No
      widened allowlist, no new row.
- [ ] Rows deleted by hand via `serializeBaseline`, then
      `pnpm parity:api:calls:tighten <shard>` for each shard touched. No
      `--write`, no reseed, ever.
- [ ] `pnpm parity:api:calls` and `pnpm parity:api:calls:args` green.
- [ ] `pnpm parity:api:extra --package activerecord` shows no new novel surface.
- [ ] SQLite, PostgreSQL and MySQL/MariaDB lanes green.
- [ ] Measure with `API_COMPARE_FORCE=1 pnpm parity:api --calls` (after a
      `pnpm build`) before trusting any NEW row.
- [ ] Split further if this will not fit the LOC ceiling; file the rest. The
      transactions set_callback family and the core find_by cluster are each
      large enough to be their own PR.
