---
title: "inheritance / inherited / modules / reflection → canonical (followup: still excluded after #3112)"
status: ready
updated: 2026-06-25
rfc: "0019-canonical-schema-burndown"
cluster: fixtures
deps: ["shared-table-convergence", "reflection-extra-burndown"]
deps-rfc: []
est-loc: 500
priority: 75
pr: null
claim: null
assignee: null
blocked-by: null
---

> **Scope override (RFC 0019 prioritization, 2026-06-25):** This story is exempt from the 500-LOC PR ceiling. Ship the full file conversion as **one PR per file**, even if additions+deletions exceed 500 LOC. Do **not** split into sibling PRs or defer part of the file to a follow-up story — the goal is to drop the file from the canonical-schema exclude list in a single PR.

## Context

**Followup to `inheritance-modules-cluster` (PR #3112, marked done).** That
story was est-450 LOC but its four files are **all still on the exclude list** —
`reflection.test.ts` alone is ~2859 LOC / 106 tables, so a single 450-LOC PR
could not have converted them. This story owns the remaining conversion.

Files (confirm exclude-JSON membership at claim time):

- `inheritance.test.ts` (~2133 LOC, 8 tbl) → `inheritance_test.rb`
- `inherited.test.ts` (~61 LOC, 2 tbl) → `inherited_test.rb`
- `modules.test.ts` (~102 LOC, 7 tbl) → `modules_test.rb`
- `reflection.test.ts` (~2859 LOC, 106 tbl) → `reflection_test.rb`

Rails drives `Company`/`Firm`/`Client`/`Account` (STI) and the namespaced
`MyApplication::Business::*` modules — all canonical.

## Acceptance criteria

- [ ] **Converged setup, not `defineSchema`:** wire each describe with
      `setupHandlerSuite()` + `useHandlerFixtures([...])`; load rows via
      `name(:label)`. Canonical tables are pre-built by global setup, so a
      converged file calls `defineSchema` **zero** times and constructs no
      `createTestAdapter`.
- [ ] Open each Rails counterpart FIRST; port each body word-for-word. Test
      names unchanged.
- [ ] No `defineSchema` left in the files. If a needed column has no canonical
      home, add it to `test-helpers/test-schema.ts` ONLY when `schema.rb` has it;
      otherwise keep a single scoped, file-unique `defineSchema` + teardown.
- [ ] Use canonical STI models (`Company`/`Firm`/`Client`) + namespaced modules;
      rows via `fixtures` + `name(:label)` where Rails does.
- [ ] Each file removed from the exclude JSON; `pnpm lint` clean, no
      `eslint-disable`.
- [ ] `pnpm vitest run <each file>` passes.

## Notes

- `reflection.test.ts` (2859 LOC) + `inheritance.test.ts` (2133 LOC) are each
  multi-PR: split per-describe across sibling PRs off `main` (NOT stacked), each
  ≤500 LOC. Ship what fits; register remaining waves as new stories — do not fan
  out yourself. `inherited.test.ts`/`modules.test.ts` can each be a single PR.

## Definition of done

All four files are out of the exclude JSON with bodies matched to Rails. An
`eslint-disable` or marking this done while files remain excluded does **not**
close this story (the failure mode this followup exists to correct).
