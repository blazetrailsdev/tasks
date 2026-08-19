---
title: "wave-4d-associations-residue-part-2"
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

# Wave 4d part 2: the remaining associations residue

## Context

Follow-up to `wave-4d-associations-residue`, whose first slice merged as
**PR #6727**. That story measured **94 `kind: "set"` rows across 20 association
shards**; #6727 converged **14** and left 80, per the parent's own last
acceptance criterion ("ship the first slice and file the rest").

NOTE: PR #6725 was opened concurrently against the same story id. It has since
been rescoped to be **disjoint** from #6727 — it reverted the overlapping
`association.ts` / `association.json` `merge!` work entirely and now carries
only two rows that #6727 never touched:

- `associations/has-one-association.ts` `delete` — `update_columns`. The
  `:nullify` arm is `target.updateColumns(nullifiedOwnerAttributes(this))`,
  mirroring `target.update_columns(nullified_owner_attributes) if
target.persisted?` (`has_one_association.rb:52`). This uses
  `ForeignAssociation#nullified_owner_attributes` (plural,
  `foreign_association.rb:13-18`) — NOT the private
  `HasOneAssociation#nullifyOwnerAttributes` whose own divergence is tracked by
  `has-one-nullify-owner-attributes-diverges-from-rails` (RFC 0113).
- `associations/belongs-to-association.ts` `update_counters_via_scope` —
  `where!`. Now `klass.unscoped().whereBang(conditions)`, mirroring
  `klass.unscoped.where!(primary_key(klass) => foreign_key)`
  (`belongs_to_association.rb:120`).

**Do not plan from "94 − 14 − 2".** Re-measured on `main` at `04d77c15a` —
after PR #6729 ("a suppressed call consumes the TS spelling it ports") changed
extraction — the association shards carry **94 `kind: "set"` rows again**: the
extractor change resurfaced roughly as many rows as the two PRs retired. Fresh
per-file counts, missing calls per file:

    14  associations/has-many-through-association.ts
     9  associations/has-many-association.ts
     8  associations.ts
     8  associations/belongs-to-association.ts
     8  associations/has-one-association.ts
     8  associations/has-one-through-association.ts
     7  associations/association.ts
     5  associations/builder/has-and-belongs-to-many.ts
     4  associations/join-dependency.ts
     3  associations/belongs-to-polymorphic-association.ts
     3  associations/collection-association.ts
     3  associations/preloader/association.ts
     3  associations/preloader/through-association.ts
     2  associations/alias-tracker.ts
     2  associations/association-scope.ts
     2  associations/builder/belongs-to.ts
     2  associations/disable-joins-association-scope.ts
     1  associations/join-dependency/join-association.ts
     1  associations/preloader/batch.ts
     1  associations/singular-association.ts

Always `pnpm build && API_COMPARE_FORCE=1 pnpm parity:api --calls` and read
`scripts/api-compare/output/call-mismatches.json` (`mismatches[].missing`)
before planning a slice — every count in this RFC goes stale as soon as a
tooling PR lands.

### What #6727 converged

- `associations.ts` — `belongs_to` / `has_one` / `has_many` call
  `Reflection.addReflection` themselves; `Builder::Association.createReflection`
  no longer does (`associations.rb:1304`, `builder/association.rb:39-50`).
- `associations/association.ts` — `scope` and `target_scope` use `mergeBang`
  in Rails' branch order (`association.rb:107-117`, `:312-314`).
- `associations/belongs-to-polymorphic-association.ts` — the three dirty-check
  overrides call `owner.attributeChanged` / `attributePreviouslyChanged` /
  `savedChangeToAttribute` directly (`belongs_to_polymorphic_association.rb`
  :12-23); the `ownerXxx` wrappers in `belongs-to-association.ts` are deleted.
- `associations/builder/has-and-belongs-to-many.ts` — `middleReflection` calls
  `HasMany.createReflection` plus a `middleOptions` private, `throughModel`
  calls a `belongsToOptions` private using activesupport's `foreignKey()`
  (`has_and_belongs_to_many.rb:59-67`, `:70-77`, `:89-102`).
- `associations/has-many-association.ts` — the `setOwnerAttributes` override
  that only re-guarded `options[:through]` is deleted (the shared collection
  body carries the guard, `foreign_association.rb:22-23`).
- `associations/has-one-association.ts` — `setOwnerAttributes` writes the
  polymorphic type column off `reflection.type` (`foreign_association.rb:35`),
  and gained the missing `return if options[:through]` guard, which was a real
  bug: `Member has_one :club, through: :current_membership` raised
  ``can't write unknown attribute `club_id` ``.

### Two traps an earlier revision recorded that are now RESOLVED

1. `set_owner_attributes` / `type` is NOT blocked on `AssociationDefinition#type`
   being the macro. Resolve the rich reflection first —
   `ctor._reflectOnAssociation?.(this.reflection.name)?.type` — which is what
   #6727 shipped. Do not re-litigate it.
2. `Association#scope`'s `merge!` is NOT blocked on the AssociationRelation
   class lacking named scopes. The cause was that `wrapWithScopeProxy` was only
   applied by `spawn()`, so a non-spawning `merge!` handed back an unwrapped
   relation and red `AssociationsExtensionsTest > extension with scopes`. #6727
   moved the wrap into the `setAssociationRelationFactory` callback, which is
   where Rails' `AssociationRelation.create` produces a relation that answers
   named scopes via `method_missing`. Both `merge!` rows are retired.

One trap that still stands: **never trust a `parity:api --calls` reading over a
stale `dist`.** Run `pnpm build` before every
`API_COMPARE_FORCE=1 pnpm parity:api --calls`.

### What is left — 80 rows

    associations/has-many-through-association.json    10
    associations/belongs-to-association.json           9
    associations/has-one-through-association.json      8
    associations/has-one-association.json              8
    associations/association.json                      5
    associations.json                                  5
    associations/has-many-association.json             5
    associations/join-dependency.json                  4
    associations/preloader/through-association.json    3
    associations/preloader/association.json            3
    associations/collection-association.json           3
    associations/builder/has-and-belongs-to-many.json  2
    associations/disable-joins-association-scope.json  2
    associations/builder/belongs-to.json               2
    associations/association-scope.json                2
    associations/alias-tracker.json                    2
    associations/singular-association.json             1
    associations/preloader/batch.json                  1
    associations/join-dependency/join-association.json 1

Leads for whoever picks this up:

- The `handle_dependency` / `delete` `destroy_async` rows across belongs-to,
  has-many and has-one (`enqueue_destroy_association`, `fetch`, `id`, `klass`,
  `map`, `first`, `primary_key`, `update_columns`) are one cluster — the
  `:destroy_async` arm is not ported in those three bodies. Converge together
  against `belongs_to_association.rb:20-49`, `has_many_association.rb:20-56`
  and `has_one_association.rb:26-55`.
- `has-one-association.ts`'s `nullify_owner_attributes` rows retire with
  `0023-surfaced-deviations/has-one-nullify-owner-attributes-diverges-from-rails`,
  which already owns the behavioural half (Rails' missing
  `unless foreign_key_column.in?(Array(record.class.primary_key))` guard, plus
  our extra type-column nullify). Coordinate rather than duplicating it.
- `associations.json`'s `has_and_belongs_to_many -> add_reflection` retires with
  `0023-surfaced-deviations/converge-habtm-builder-to-rails-macro-sequence`:
  `HabtmBuilder._build` registers both reflections itself and returns nothing,
  so the macro has none to pass on.
- `alias-tracker.json`'s two rows are the lazy `_getCount` restructuring
  (`create` no longer calls `initial_count_for`) and Ruby `Array#size` vs JS
  `.length`; the second may be noise and wants a per-site reason, not a
  conversion.

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
