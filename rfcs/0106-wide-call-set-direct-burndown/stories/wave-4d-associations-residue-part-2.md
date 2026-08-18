---
title: "wave-4d-associations-residue-part-2"
status: ready
updated: 2026-08-18
rfc: "0106-wide-call-set-direct-burndown"
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

# Wave 4d part 2: the remaining associations residue

## Context

Follow-up to `wave-4d-associations-residue`, which shipped the first slice
(PR to be linked). That story measured **94 `kind: "set"` rows across 20
association shards**; the first slice converged three of them and left the rest
untouched rather than exceeding the LOC ceiling (the story's own last
acceptance criterion: "ship the first slice and file the rest").

### What the first slice converged

- `associations/association.ts` `scope` / `target_scope` — `merge!`.
  `targetScope()` now ends `arFactory(klass, this).mergeBang(sfa)`, mirroring
  `AssociationRelation.create(klass, self).merge!(klass.scope_for_association)`
  (`activerecord/lib/active_record/associations/association.rb:313`). Both
  `merge!` rows retired.
- `associations/has-one-association.ts` `delete` — `update_columns`. The
  `:nullify` arm is now
  `target.updateColumns(nullifiedOwnerAttributes(this))`, mirroring
  `target.update_columns(nullified_owner_attributes) if target.persisted?`
  (`has_one_association.rb:52`), instead of an in-memory nullify + `save()`.
- `associations/belongs-to-association.ts` `update_counters_via_scope` —
  `where!`. Now `klass.unscoped().whereBang(conditions)`, mirroring
  `klass.unscoped.where!(primary_key(klass) => foreign_key)`
  (`belongs_to_association.rb:120`).

### What is left, and what was learned

Measured with `API_COMPARE_FORCE=1 pnpm parity:api --calls` on the slice branch:

    associations/has-one-association.ts   delete                      primary_key, id, klass, fetch, enqueue_destroy_association
    associations/has-one-association.ts   nullify_owner_attributes    foreign_key, primary_key
    associations/has-one-association.ts   set_owner_attributes        type
    associations/belongs-to-association.ts handle_dependency          foreign_key, map, klass, id, fetch, enqueue_destroy_association
    associations/belongs-to-association.ts update_counters            require_counter_update?, update_counters_via_scope
    associations/association.ts            scope / target_scope       create
    associations/association.ts            skip_statement_cache?      any?
    associations/has-many-through-association.ts  delete_records / distribution / find_target / target_scope / stale_state / build_record
    associations/has-one-through-association.ts   replace / target_scope / stale_state / foreign_key_present?
    + the remaining 13 shards listed in the parent story

Three traps found while measuring, worth carrying forward:

1. **`AssociationDefinition#type` is the MACRO, not the polymorphic column.**
   The `set_owner_attributes` / `type` row looks like a one-line fix
   (`record._write_attribute(reflection.type, ...)`,
   `foreign_association.rb:36`) but `this.reflection` inside an `Association`
   is the lightweight `AssociationDefinition`, whose `type` field is
   `"hasOne"` / `"belongsTo"` (`associations.ts:162`, and see the `macro`
   JSDoc at :178-186). Only the _rich_ reflection spells `type` as Rails does.
   Converging this needs the rich reflection resolved first.

2. **`Association#scope`'s `merge!` cannot converge until the
   AssociationRelation class carries named scopes.** Replacing
   `target.merge(associationScope)` with `mergeBang` (which is what
   `association.rb:113-115` does) reds
   `AssociationsExtensionsTest > extension with scopes` —
   `this.scope()[name] is not a function` at
   `collection-proxy.ts:2211`. The relation `associationRelationClassFor(klass)`
   builds does not carry the model's named scopes; the old `merge` masked that
   because `merge` is `spawn().mergeBang()` and the `spawn()` upgraded the
   class. The measured consequence is that a `scope()` mergeBang is blocked on
   fixing that wiring, which is a separate (real) bug.

3. **Never trust a `parity:api --calls` reading over a stale `dist`.** The
   extractor throws on a stale build only when it notices; with
   `API_COMPARE_FORCE=1` and an unbuilt edit, a `scope` ordering row
   (`order:mergeBang,globalCurrentScope`) appeared and persisted across two
   edits that should have changed it, and vanished after `pnpm build`. Run
   `pnpm build` before every measurement.

## Acceptance criteria

- [ ] Every remaining row in the 20 association shards is either converged
      (the TS body makes the call Rails makes, verified against the Rails
      source line) or leaves as a reviewed one-line per-site reason / a
      `@missingRailsCall` tag at the call site. No widened allowlist, no new
      row.
- [ ] Rows deleted by hand via `serializeBaseline`, then
      `pnpm parity:api:calls:tighten <shard>` for each shard touched. No
      `--write`, no reseed, ever.
- [ ] `pnpm parity:api:calls` and `pnpm parity:api:calls:args` green.
- [ ] SQLite, PostgreSQL and MySQL/MariaDB lanes green.
- [ ] `pnpm build` before every `API_COMPARE_FORCE=1 pnpm parity:api --calls`.
- [ ] Split across more than one PR if the LOC ceiling demands it — ship a
      slice and file the rest rather than exceeding the ceiling.
