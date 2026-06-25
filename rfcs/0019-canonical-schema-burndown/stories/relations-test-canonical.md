---
title: "relations.test.ts -> relations_test.rb canonical port (split per-describe)"
status: ready
updated: 2026-06-25
rfc: "0019-canonical-schema-burndown"
cluster: fixtures
deps: ["shared-table-convergence"]
deps-rfc: []
est-loc: 500
priority: 76
pr: null
claim: null
assignee: null
blocked-by: null
---

> **Scope override (RFC 0019 prioritization, 2026-06-25):** This story is exempt from the 500-LOC PR ceiling. Ship the full file conversion as **one PR per file**, even if additions+deletions exceed 500 LOC. Do **not** split into sibling PRs or defer part of the file to a follow-up story — the goal is to drop the file from the canonical-schema exclude list in a single PR.

## Context

Convert `packages/activerecord/src/relations.test.ts` (~6962 LOC, 22 inline
tables) onto the canonical schema, matched to Rails.

- trails: `relations.test.ts`
- Rails: `vendor/rails/activerecord/test/cases/relations_test.rb`

Rails' `relations_test.rb` (~6900 LOC) drives `Post`/`Author`/`Comment`/
`Topic`/`Developer`/`Tag` across the whole Relation surface — all canonical.
This is one of the largest files in the burndown; it MUST ship per-describe
across sibling PRs.

## Acceptance criteria

- [ ] **Converged setup, not `defineSchema`:** wire each describe with
      `setupHandlerSuite()` + `useHandlerFixtures([...])` (Rails `fixtures :name`);
      load rows via `name(:label)` registry lookups. The canonical tables are
      pre-built once per worker by `template-global-setup.ts`, so a converged
      file calls `defineSchema` **zero** times and constructs no
      `createTestAdapter`.
- [ ] Open `relations_test.rb` FIRST; port each body word-for-word. Test names
      unchanged.
- [ ] No `defineSchema` left in the file. If a needed column has no canonical
      home, add it to `test-helpers/test-schema.ts` ONLY when Rails `schema.rb`
      has it (parity-check first); otherwise keep a single scoped, file-unique
      `defineSchema` + teardown for that one table (never the shared name).
- [ ] Use canonical models; rows via `fixtures` + `name(:label)` where Rails
      does.
- [ ] File removed from the exclude JSON ONLY in the final PR, after the whole
      file lint-passes with no `eslint-disable`.
- [ ] `pnpm vitest run packages/activerecord/src/relations.test.ts` passes.

## Notes

- ~6962 LOC: many sibling PRs off `main` (non-overlapping describes, NOT
  stacked). Each PR ≤500 LOC. Ship what fits; register each remaining wave as a
  new story via `pnpm tasks new` — do not fan out sibling PRs yourself.

## Definition of done

Fidelity is the deliverable. An `eslint-disable` or leaving the file excluded
does **not** close this story.
