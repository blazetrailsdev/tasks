---
title: "disable-joins association family → canonical schema + Rails fixtures"
status: draft
updated: 2026-06-11
rfc: "0019-canonical-schema-burndown"
cluster: fixtures
deps: ["associations-collection-cluster"]
deps-rfc: []
est-loc: 450
priority: 8
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Convert the `disable_joins` association family onto the canonical schema. These
are **trails-internal** harnesses (no 1:1 Rails source file — `disable_joins` is
tested in Rails inside the broader has_many/through files), so **fidelity step 4
does not apply**; the bar is steps 1–3: ride `TEST_SCHEMA` + canonical models +
fixtures, no inline tables.

Files (confirm each is still excluded at claim time):

- `associations/disable-joins-association-scope.test.ts` (~248 LOC, 3 tbl)
- `associations/disable-joins-composite-key.test.ts` (~441 LOC, 4 tbl)
- `associations/disable-joins-composite-nested.test.ts` (~222 LOC, 5 tbl)
- `associations/disable-joins-nested-through.test.ts` (~209 LOC, 4 tbl)
- `associations/disable-joins-polymorphic-nonid-pk.test.ts` (~230 LOC, 5 tbl)
- `associations/disable-joins-routing-widening.test.ts` (~222 LOC, 4 tbl)
- `associations/cp-count-disable-joins-through.test.ts` (~202 LOC, 4 tbl)

These exercise the two-query routing path; the scratch tables (composite-key /
polymorphic-nonid shapes) often have no `schema.rb` analog and should be renamed
file-unique rather than forced into the canonical schema.

## Acceptance criteria

- [ ] **Converged setup, not `defineSchema`:** wire the file with
      `setupHandlerSuite()` + `useHandlerFixtures([...])` (Rails `fixtures :name`);
      load rows via `name(:label)` registry lookups. The canonical tables are
      pre-built once per worker by `template-global-setup.ts`, so a converged
      file calls `defineSchema` **zero** times and constructs no
      `createTestAdapter`.
- [ ] No `defineSchema` left in the file. If a needed column has no canonical
      home, add it to `test-helpers/test-schema.ts` ONLY when Rails `schema.rb`
      has it (parity-check first); otherwise keep a single scoped, file-unique
      `defineSchema` + teardown for that one table (never the shared name).
- [ ] Use canonical models with `disable_joins: true` where the canonical schema
      supports the association.
- [ ] Each file removed from the exclude JSON; `pnpm lint` clean, no
      `eslint-disable` (a genuinely un-canonical adapter/DDL line may keep a
      scoped disable with a one-line reason — but not as a shortcut).
- [ ] `pnpm vitest run <each file>` passes.

## Notes

- Related: `hmt-disable-joins-conversion` is framework-blocked on two
  association-layer gaps; do not pull its file into this cluster.

## Definition of done

Riding the canonical schema (or file-unique scratch where no analog exists)
with no inline collisions. Blanket `eslint-disable` does **not** close this
story.
