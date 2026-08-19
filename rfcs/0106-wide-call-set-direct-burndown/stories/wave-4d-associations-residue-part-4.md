---
title: "Wave 4d part 4: the associations call-set residue (destroy_async, ThroughAssociation, helper decompositions)"
status: done
updated: 2026-08-19
rfc: "0106-wide-call-set-direct-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 400
priority: null
pr: 6739
claim: "2026-08-19T13:26:32Z"
assignee: "wave-4d-associations-residue-part-4"
blocked-by: null
closed-reason: null
---

# Wave 4d part 4: the associations residue after wave-4d part 3

## Context

Fourth slice of the association `kind: "set"` burndown. The
`wave-4d-associations-residue-part-3` bundle PR retired seven association rows
by writing reviewed per-site reasons for the Ruby-core-idiom noise:

    associations/alias-tracker.json            create -> initial_count_for, initial_count_for -> size
    associations/association-scope.json        get_chain -> drop
    associations/builder/belongs-to.json       define_validations -> delete, touch_record -> first
    associations/has-many-through-association.json  delete_records -> count
    associations/preloader/association.json    target_for -> wrap

Everything else in the 19 association shards is still open. The remaining work
splits into four clusters, each wanting its own PR:

1. **The `:destroy_async` arm (~17 rows).** `handle_dependency` on
   belongs-to and has-many and `delete` on has-one all omit the
   `enqueue_destroy_association` branch: `enqueue_destroy_association`,
   `fetch`, `id`, `klass`, `map`, `first`, `primary_key`, `foreign_key`,
   `update_columns`. Converge together against `belongs_to_association.rb:20-49`,
   `has_many_association.rb:20-56`, `has_one_association.rb:26-55`.

2. **The `ThroughAssociation` module cluster.** `stale_state`, `target_scope`
   (`-> drop`, `-> scope_for_association`) and `foreign_key_present?` on both
   has-one-through and has-many-through. Rails puts these in the
   `ThroughAssociation` module (`through_association.rb:34-43`, `:82-94`) and
   `include`s it into both classes; trails re-declares them as
   `protected override` wrappers delegating to `through-association.ts`, with
   the base body threaded in as an explicit `super["targetScope"]()` argument.
   Converging means mixing `through-association.ts` in via `include()` /
   `Included<>`; check whether the module-`super` thread is a genuine TS
   shortcoming before writing any reason.

3. **Rows owned by existing 0023 stories** — do not duplicate, coordinate:
   `has-one-association.json` `nullify_owner_attributes -> foreign_key` /
   `-> primary_key` retire with
   `0023-surfaced-deviations/has-one-nullify-owner-attributes-diverges-from-rails`;
   `associations.json` `has_and_belongs_to_many -> add_reflection` retires with
   `0023-surfaced-deviations/converge-habtm-builder-to-rails-macro-sequence`.

4. **Missing private-helper decompositions** — each is a real fidelity gap, not
   noise, because Rails names a private method the TS body inlined:
   `belongs-to-association.json` `update_counters -> require_counter_update?` /
   `-> update_counters_via_scope`; `disable-joins-association-scope.json`
   `scope -> add_constraints` / `-> last_scope_chain`;
   `has-one-through-association.json` `replace -> create_through_record`;
   `join-dependency.json` `make_constraints -> aliased_table_for`;
   `preloader/association.json` `load_records -> records_for`;
   `preloader/batch.json` `call -> group_and_load_similar`;
   `builder/has-and-belongs-to-many.json` `through_model -> belongs_to` /
   `-> call`.

Two rows were deliberately NOT reasoned in part 3 because the reading did not
hold up and want a fresh look: `has-many-through-association.json`
`build_record -> map` (no `map` is visible in `has_many_through_association.rb:90-114`)
and `association.json` `skip_statement_cache? -> any?` (no `skipStatementCache`
exists anywhere under `packages/activerecord/src/` — the method may be unported
rather than divergent).

ALWAYS re-measure before planning a slice:

    pnpm build && API_COMPARE_FORCE=1 pnpm parity:api --calls

then read `scripts/api-compare/output/call-mismatches.json` (`mismatches[].missing`).

## Acceptance criteria

- [ ] Every remaining row in the association shards is either converged (the TS
      body makes the call Rails makes, verified against the Rails source line)
      or leaves a reviewed one-line per-site reason / a `@missingRailsCall` tag
      at the call site. No widened allowlist, no new row.
- [ ] Rows deleted by hand via `serializeBaseline`, then
      `pnpm parity:api:calls:tighten <shard>` for each shard touched. No
      `--write`, no reseed.
- [ ] `pnpm parity:api:calls` and `pnpm parity:api:calls:args` green.
- [ ] `pnpm parity:api:extra --package activerecord` shows no new novel surface.
- [ ] SQLite, PostgreSQL and MySQL/MariaDB lanes green.
- [ ] Split across more than one PR if the LOC ceiling demands it — the four
      clusters above are the natural split.
