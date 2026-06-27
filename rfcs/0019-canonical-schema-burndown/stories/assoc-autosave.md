---
title: "Port autosave-association.test.ts to canonical schema"
status: claimed
updated: 2026-06-27
rfc: "0019-canonical-schema-burndown"
cluster: fixtures
deps: ["shared-table-convergence"]
deps-rfc: []
est-loc: 500
priority: 69
pr: null
claim: "2026-06-27T11:58:18Z"
assignee: "assoc-autosave"
blocked-by: null
---

> **Scope override (RFC 0019 prioritization, 2026-06-25):** This story is exempt from the 500-LOC PR ceiling. Ship the full file conversion as **one PR per file**, even if additions+deletions exceed 500 LOC. Do **not** split into sibling PRs or defer part of the file to a follow-up story — the goal is to drop the file from the canonical-schema exclude list in a single PR.

## Context

Convert `packages/activerecord/src/autosave-association.test.ts` (~4628 LOC, **145 inline tables**)
onto the canonical schema, matched to Rails.

- trails: `autosave-association.test.ts`
- Rails: `vendor/rails/activerecord/test/cases/autosave_association_test.rb`

Rails drives `Pirate`/`Ship`/`Bird`/`Parrot`/`Person` with `autosave: true` nested-save chains — all canonical. The inline tables here are per-test
scratch shapes and the single biggest collision surface in the suite; collapse
them onto the canonical association tables or rename file-unique where a column
has no `schema.rb` analog. `deps: shared-table-convergence` guarantees the
shared `posts`/`comments`/`authors` shapes are converged before this starts.

## Acceptance criteria

- [ ] **Converged setup, not `defineSchema`:** wire the file with
      `setupHandlerSuite()` + `useHandlerFixtures([...])` (Rails `fixtures :name`);
      load rows via `name(:label)` registry lookups. The canonical tables are
      pre-built once per worker by `template-global-setup.ts`, so a converged
      file calls `defineSchema` **zero** times and constructs no
      `createTestAdapter`.
- [ ] Open `autosave_association_test.rb` FIRST; port each body word-for-word — same assertions,
      order, control structure. Test names unchanged (`test:compare` matches on
      names).
- [ ] No `defineSchema` left in the file. If a needed column has no canonical
      home, add it to `test-helpers/test-schema.ts` ONLY when Rails `schema.rb`
      has it (parity-check first); otherwise keep a single scoped, file-unique
      `defineSchema` + teardown for that one table (never the shared name).
- [ ] Replace bespoke `class X extends Base` with the canonical registry models
      (`Pirate`/`Ship`/`Bird`/`Parrot`/`Person` with `autosave: true` nested-save chains) and their Rails associations; rows via `fixtures` +
      `name(:label)` where Rails does.
- [ ] File removed from `eslint/require-canonical-schema-exclude.json` ONLY in
      the final PR, after the whole file lint-passes with no `eslint-disable`.
- [ ] `pnpm vitest run packages/activerecord/src/autosave-association.test.ts` passes (co-run colliding
      siblings under `maxForks=1`).

## Notes

- ~4628 LOC, 145 tables: this is multi-PR. Split per-describe across sibling
  PRs off `main` (non-overlapping describes, NOT stacked), each ≤500 LOC. Ship
  what fits; register each remaining wave with `pnpm tasks new` — do NOT fan out
  sibling PRs yourself (one agent owning N PRs orphans them).

## Definition of done

A PR that swaps the schema but leaves bodies diverging from Rails is **not
done** — fidelity is the deliverable. An `eslint-disable` or leaving the file
in the exclude JSON does **not** close this story.
