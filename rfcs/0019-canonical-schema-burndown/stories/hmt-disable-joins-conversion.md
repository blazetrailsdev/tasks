---
title: "has-many-through disable-joins conversion (framework-blocked) → canonical schema + fixtures"
status: ready
updated: 2026-06-29
rfc: "0019-canonical-schema-burndown"
cluster: fixtures
deps: ["associations-collection-cluster"]
deps-rfc: []
est-loc: 150
priority: 8
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Convert `packages/activerecord/src/associations/has-many-through-disable-joins-associations.test.ts`
(~643 LOC, 6 inline tables) onto canonical fixtures, matched to Rails.

- trails: `associations/has-many-through-disable-joins-associations.test.ts`
- Rails: `vendor/rails/activerecord/test/cases/associations/has_many_through_disable_joins_associations_test.rb`

**This story is framework-blocked** (see `blocked-by`): a faithful port surfaces
two association-layer gaps. Do NOT paper over them with an `eslint-disable` or a
weakened test — the prerequisite framework fixes must land under
`0005-activerecord-gaps` first.

## Acceptance criteria

- [ ] **Converged setup, not `defineSchema`:** wire the file with
      `setupHandlerSuite()` + `useHandlerFixtures([...])` (Rails `fixtures :name`);
      load rows via `name(:label)` registry lookups. The canonical tables are
      pre-built once per worker by `template-global-setup.ts`, so a converged
      file calls `defineSchema` **zero** times and constructs no
      `createTestAdapter`.
- [ ] Prerequisite framework fixes landed: (1) `updateCounters` honors
      `counter_cache` + `alias_attribute`; (2) `ThroughReflection.klass` resolves
      via `sourceReflection`. Register these as 0005 stories before claiming.
- [ ] Open `has_many_through_disable_joins_associations_test.rb` FIRST; port
      each body word-for-word. Test names unchanged.
- [ ] No `defineSchema` left in the file. If a needed column has no canonical
      home, add it to `test-helpers/test-schema.ts` ONLY when Rails `schema.rb`
      has it (parity-check first); otherwise keep a single scoped, file-unique
      `defineSchema` + teardown for that one table (never the shared name).
- [ ] Use canonical `Author`/`Post`/`Comment` with `has_many :through,
disable_joins: true`; rows via `fixtures` + `name(:label)`.
- [ ] File removed from the exclude JSON; `pnpm lint` clean, no `eslint-disable`.
- [ ] `pnpm vitest run packages/activerecord/src/associations/has-many-through-disable-joins-associations.test.ts`
      passes.

## Definition of done

Fidelity is the deliverable, AFTER the framework gaps are fixed. An
`eslint-disable`, a weakened test, or leaving the file excluded does **not**
close this story.
