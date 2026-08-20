---
title: "Mix ThroughAssociation into both through classes instead of per-class wrappers"
status: claimed
updated: 2026-08-20
rfc: "0106-wide-call-set-direct-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 350
priority: null
pr: null
claim: "2026-08-20T11:52:30Z"
assignee: "wave-4d-through-association-mixin-cluster"
blocked-by: null
closed-reason: null
---

## Context

Cluster 2 of the `wave-4d-associations-residue-part-4` split (part 4 shipped as
PR 6739 and took only the tractable half of cluster 4).

Rails puts `stale_state`, `target_scope` and `foreign_key_present?` in the
`ThroughAssociation` module and `include`s it into both
`HasOneThroughAssociation` and `HasManyThroughAssociation`:

- `activerecord/lib/active_record/associations/through_association.rb:34-43`
  — `target_scope`: `scope = super; reflection.chain.drop(1).each { |refl| ...
relation = refl.klass.scope_for_association; scope.merge!(relation.except(...)) }`
- `activerecord/lib/active_record/associations/through_association.rb:82-94`
  — `stale_state` / `foreign_key_present?`, both branching on
  `through_reflection.belongs_to?` and reading `foreign_key`.
- `has_one_through_association.rb:7` / `has_many_through_association.rb:8`
  — `include ThroughAssociation`.

trails instead re-declares each as a `protected override` wrapper on both
classes, delegating to free functions in
`packages/activerecord/src/associations/through-association.ts`, and threads the
base body in as an explicit `super["targetScope"]()` argument. That produces six
open `kind: "set"` rows:

    associations/has-many-through-association.json  target_scope -> drop, scope_for_association
    associations/has-many-through-association.json  stale_state  -> belongs_to?, foreign_key
    associations/has-one-through-association.json   target_scope -> drop, scope_for_association
    associations/has-one-through-association.json   stale_state  -> belongs_to?, foreign_key
    associations/has-one-through-association.json   foreign_key_present? -> belongs_to?, foreign_key, all?

The converged shape is the settled trails mixin idiom: mix
`through-association.ts` into both classes via `include()` / `Included<>` from
`@blazetrails/activesupport` (see `activesupport/src/include.ts` and
`relation.ts` + `relation/query-methods.ts`), so each method lives once, at the
Rails name, in the Rails file, and is called on `this`.

The one thing to establish before writing any reason: whether the module-`super`
thread (Ruby's `super` inside an included module resolving to the class's own
ancestor) is a genuine TS shortcoming under `include()` / `Included<>`, or
whether the mixin idiom already handles it. CONVERGE, do not ratify — a reason
is only acceptable for a proven language shortcoming.

## Acceptance criteria

- [ ] `through-association.ts` is mixed into both through-association classes
      via `include()` / `Included<>`; the per-class `protected override`
      delegating wrappers are deleted.
- [ ] `targetScope`, `staleState` and `foreignKeyPresent` each exist once, at
      the Rails name, with Rails' body and branch order.
- [ ] The `super` thread is either resolved by the mixin idiom or documented at
      the call site as a proven TS shortcoming with a Rails cite.
- [ ] All six rows converged (deleted by hand via `serializeBaseline`) or
      reasoned. No reseed, no widened allowlist.
- [ ] `pnpm parity:api:calls` / `:args` green; `pnpm parity:api:extra --package
activerecord` shows no new novel surface; marks tightened per shard.
- [ ] SQLite, PostgreSQL and MySQL/MariaDB lanes green.
