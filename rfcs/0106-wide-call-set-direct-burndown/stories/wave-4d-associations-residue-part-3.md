---
title: "wave-4d-associations-residue-part-3"
status: done
updated: 2026-08-19
rfc: "0106-wide-call-set-direct-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6734
claim: "2026-08-19T01:18:03Z"
assignee: "wave-4d-associations-residue-part-3"
blocked-by: null
closed-reason: null
---

# Wave 4d part 3: the associations residue after wave-4d-associations-residue-part-2

## Context

Third slice of the association `kind: "set"` burndown, after PR #6727,
PR #6725 and the `wave-4c-ar-core-residue-model-b` bundle PR. That last PR
converged exactly one association row —
`associations/has-many-through-association.ts` `delete_records -> update_counter`
(`has_many_through_association.rb:168-173`): the body now calls the inherited
`HasManyAssociation#update_counter` (`this.updateCounter(-count,
throughReflection)` / `this.updateCounter(-count)`) and the two trails-only
helpers it used instead, `throughCounterReflection` and
`updateThroughCounterCache`, are deleted. `update_through_counter?` reads
`this.throughReflection()` inline, as Rails does.

ALWAYS re-measure before planning a slice:

    pnpm build && API_COMPARE_FORCE=1 pnpm parity:api --calls

then read `scripts/api-compare/output/call-mismatches.json` (`mismatches[].missing`).
Never trust a reading over a stale `dist`.

Remaining rows, as measured at that PR's branch point (79 across 19 shards):

    associations/has-many-through-association.json     9
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

Leads:

- The `handle_dependency` / `delete` `destroy_async` rows across belongs-to,
  has-many and has-one (`enqueue_destroy_association`, `fetch`, `id`, `klass`,
  `map`, `first`, `primary_key`, `update_columns`) are one cluster of ~17 rows —
  the `:destroy_async` arm is not ported in those three bodies. Converge
  together against `belongs_to_association.rb:20-49`,
  `has_many_association.rb:20-56` and `has_one_association.rb:26-55`. Its own PR.
- `has-one-association.ts`'s `nullify_owner_attributes` rows retire with
  `0023-surfaced-deviations/has-one-nullify-owner-attributes-diverges-from-rails`.
  Coordinate rather than duplicating it.
- `associations.json`'s `has_and_belongs_to_many -> add_reflection` retires with
  `0023-surfaced-deviations/converge-habtm-builder-to-rails-macro-sequence`.
- The `stale_state` / `target_scope` / `foreign_key_present?` rows on
  has-one-through and has-many-through are one structural cluster: Rails puts
  these in the `ThroughAssociation` module (`through_association.rb:34-43`,
  `:82-94`) and `include`s it into both classes, while trails re-declares them
  as `protected override` wrappers that delegate to `through-association.ts`
  and thread the base body in as an explicit `super["targetScope"]()` argument.
  Converging means mixing `through-association.ts` in via `include()` /
  `Included<>` rather than re-declaring; check whether the module-`super`
  thread is a genuine TS shortcoming before writing any reason.
- A large fraction of the remainder is Ruby-core-idiom noise with no TS call to
  make: `empty?`, `size`, `any?`, `all?`, `include?`, `drop`, `map`, `first`,
  `fetch`, `delete` (the `Hash#delete`-returns-the-value form in
  `builder/belongs_to.rb:114-116`). Those want a reviewed one-line per-site
  reason, not a conversion — see the existing reviewed reason on
  `scoping/default.json` `scope_attributes? -> any?` for the wording to match.

## Acceptance criteria

- [ ] Every remaining row in the 19 association shards is either converged
      (the TS body makes the call Rails makes, verified against the Rails
      source line) or leaves a reviewed one-line per-site reason / a
      `@missingRailsCall` tag at the call site. No widened allowlist, no new row.
- [ ] Rows deleted by hand via `serializeBaseline`, then
      `pnpm parity:api:calls:tighten <shard>` for each shard touched. No
      `--write`, no reseed, ever.
- [ ] `pnpm parity:api:calls` and `pnpm parity:api:calls:args` green.
- [ ] `pnpm parity:api:extra --package activerecord` shows no new novel surface.
- [ ] SQLite, PostgreSQL and MySQL/MariaDB lanes green.
- [ ] `pnpm build` before every `API_COMPARE_FORCE=1 pnpm parity:api --calls`.
- [ ] Split across more than one PR if the LOC ceiling demands it — ship a
      slice and file the rest rather than exceeding the ceiling.
