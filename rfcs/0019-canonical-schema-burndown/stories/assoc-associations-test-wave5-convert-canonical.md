---
title: "assoc-associations-test-wave5-convert-canonical"
status: claimed
updated: 2026-06-17
rfc: "0019-canonical-schema-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-06-17T19:24:46Z"
assignee: "assoc-associations-test-wave5-convert-canonical"
blocked-by: null
---

## Context

Follow-up to `assoc-associations-test-wave4-convert-canonical` (RFC 0019). Wave 4
converted the top non-CPK general batch of the first `AssociationsTest` describe
in `packages/activerecord/src/associations.test.ts` onto canonical models +
fixtures and moved them into the canonical (second) `AssociationsTest` describe:

- `eager loading should not change count of children` -> `Liquid`/`Molecule`/`Electron`
- `loading the association target should keep child records marked for destruction` -> `Ship`/`ShipPart`
- `loading the association target should load most recent attributes for child records marked for destruction` -> `Ship`/`ShipPart`
- `include with order works` -> `Account`/`Company`
- `bad collection keys` -> `Class.new(Base).hasMany("wheels", { name })` raises

Wave 4 also removed the now-unused scratch tables from the inline `defineSchema`:
`ships`, `ship_parts`, `el_parents`, `el_children`, `d_posts`, `d_comments`,
`io_posts`, `io_comments`, `a_posts`, `a_comments`. (See wave 4 PR.)

Fidelity note discovered in wave 4: Rails `ship.parts[0]` uses load-target
semantics that merge in-memory records over DB rows (preserving
marked-for-destruction and refreshing unchanged attributes). In trails, the
faithful equivalent is `association(x, name).load()` -- `toArray()` returns fresh
DB instances and drops in-memory records. Use `.load()` for `[0]`-style access.

The remaining bespoke bodies in the FIRST `AssociationsTest` describe still ride
the inline `defineSchema` scratch tables (`cpk_*`, `qwar_*`, `qsar_*`, `dqc_*`,
`b_*`, `c_*`, `inf_*`, `pbt_*`, `as_cpk_*`, `cfk_*`, `cqc_*`, etc.) and must be
converted onto canonical CPK / Sharded models (`test-helpers/models/cpk/*`,
`.../sharded/*`) + fixtures. These include (test names, first describe):

- `loading cpk association when persisted and in memory differ`
- `should construct new finder sql after create` (Person/Reader/Post)
- `force reload` (Firm/Client)
- `belongs to a model with composite foreign key finds associated record`
- `belongs to a cpk model by id attribute`
- `belongs to a model with composite primary key uses composite pk in sql`
- `querying by whole/single associated records using query constraints`
- `querying by relation with composite key`
- `has many association with composite foreign key loads records`
- `has many association from a model with query constraints different from the association`
- `query constraints over three without defining explicit foreign key query constraints raises`
- `model with composite query constraints has many association sql`
- `has many/one loads via inline fallback resolving composite owner key from query constraints`
- `belongs to association does not use parent query constraints if not configured to`
- `polymorphic belongs to uses parent query constraints`
- `preloads model with query constraints by explicitly configured fk and pk`
- `nullify/assign (persisted) composite foreign key belongs_to / has_many`
- `setBelongsTo infers/nullifies composite foreign key`
- `query constraints that dont include the primary key raise (single / multiple columns)`
- `assign belongs to cpk model by id attribute`
- `append/assign composite foreign key ... with autosave`
- `append/nullify/delete composite has many through association`
- `composite has many through raises ConfigurationError when target model has composite primary key`
- `polymorphic-through with composite owner primary key requires explicit single-column primaryKey`
- `belongs to with explicit composite foreign key`
- `cpk model has many records by id attribute`

- trails: `packages/activerecord/src/associations.test.ts`
- Rails: `vendor/rails/activerecord/test/cases/associations_test.rb`

## Acceptance criteria

- [ ] Port each remaining first-`AssociationsTest`-describe body word-for-word
      from `associations_test.rb` onto canonical CPK / Sharded models + fixtures;
      test names unchanged. Move converted bodies into the canonical (second)
      `AssociationsTest` describe.
- [ ] Remove each scratch table from the inline `defineSchema` as its last
      consumer is converted.
- [ ] Split into non-overlapping <=500 LOC sibling PRs off main (NOT stacked) if
      it does not fit in one; register further waves rather than fanning out.
- [ ] FINAL wave only: drop `associations.test.ts` from
      `eslint/require-canonical-schema-exclude.json`; `test:compare` delta
      non-negative; `pnpm vitest run packages/activerecord/src/associations.test.ts` passes.
