---
title: "associations/eager.test.ts → canonical schema + eager_test.rb (multi-wave)"
status: done
updated: 2026-06-28
rfc: "0019-canonical-schema-burndown"
cluster: fixtures
deps: []
deps-rfc: []
est-loc: 500
priority: 3
pr: 4235
claim: "2026-06-28T17:06:34Z"
assignee: "assoc-eager-suite-canonical"
blocked-by: null
---

> **Scope override (RFC 0019 prioritization):** This file is exempt from the
> 500-LOC PR ceiling per the RFC 0019 per-file convention, BUT it is too large
> for one PR (~4970 LOC, 22 `defineSchema` calls). Convert it in **sequential
> waves**, single-owner, each wave a ≤500-LOC PR off `main` (NOT stacked, NOT
> parallel sibling stories). The file stays in the exclude list until the FINAL
> wave delists it — the lint gate is per-file all-or-nothing, so partial PRs do
> not move the ratchet. When a wave leaves more than one PR of work, register
> the next wave with `pnpm tasks new` before the PR merges.

## Context

`packages/activerecord/src/associations/eager.test.ts` (~4970 LOC, **22
`defineSchema` calls**, 193 `it(` / 9 `it.skip`) is the largest remaining file
in the RFC 0019 canonical-schema exclude list and currently has **no live
story**. It is a partial conversion: the later `describe` blocks already ride
`setupHandlerSuite()` + `useHandlerFixtures([...])`, but two large bespoke
seams remain:

1. **A file-local `const TEST_SCHEMA: Schema` (line 69)** — a bespoke literal
   that shadows the canonical name. It defines ~80+ scratch tables prefixed
   `eager_*`, `alar_*`, `dp_*`, `eabt_*`, `cpk_*`, etc., and backs the first
   big `describe("EagerAssociationTest")` block (line 366 → ~2695, fed by the
   `defineSchema(TEST_SCHEMA)` at line 370).
2. **~21 smaller inline `defineSchema(...)` describes** (lines 2705–4792),
   several already mixing canonical fixtures with bespoke shapes (e.g. line
   4051 `defineSchema({ companies: canonicalSchema.companies }, { dropExisting:
true })`).

- trails: `associations/eager.test.ts`
- Rails: `vendor/rails/activerecord/test/cases/associations/eager_test.rb`
  (1773 LOC). Rails `EagerAssociationTest` drives canonical
  `Author`/`Post`/`Comment`/`Category`/`Categorization`/`Tag`/`Tagging`/
  `Company`/`Firm`/`Client`/`Developer`/`Project` plus the CPK models
  (`Cpk::Order`/`Cpk::Book`/...) — all canonical.

## Acceptance criteria

- [ ] **Converged setup, not `defineSchema`:** wire each converted describe with
      `setupHandlerSuite()` + `useHandlerFixtures([...])` (Rails `fixtures :name`);
      load rows via `name(:label)` registry lookups. Canonical tables are
      pre-built once per worker by `template-global-setup.ts`, so a fully
      converged file calls `defineSchema` **zero** times and constructs no
      `createTestAdapter`.
- [ ] Delete the file-local `const TEST_SCHEMA` and every bespoke `eager_*` /
      `alar_*` / `dp_*` / `eabt_*` scratch table; ride canonical models.
- [ ] Open `eager_test.rb` FIRST; port each body word-for-word. **Test names
      UNCHANGED** (`test:compare` matches on names).
- [ ] No `defineSchema` left in the file. If a needed column has no canonical
      home, add it to `test-helpers/test-schema.ts` ONLY when Rails `schema.rb`
      has it (parity-check first); otherwise keep a single scoped, file-unique
      `defineSchema` + teardown for that one table (never a shared name).
- [ ] Tests that hit a genuine impl gap are `it.skip` with a comment referencing
      the gap story (register the gap under `0005-activerecord-gaps` first).
- [ ] File removed from `eslint/require-canonical-schema-exclude.json` only once
      FULLY converted; `pnpm lint` clean, no `eslint-disable`.
- [ ] `pnpm vitest run packages/activerecord/src/associations/eager.test.ts`
      passes (co-run colliding siblings under `maxForks=1`).

## Notes

- ~4970 LOC across 22 schemas: multi-wave. Suggested wave seams:
  - **Wave A** — the file-local `TEST_SCHEMA` + first `EagerAssociationTest`
    block (366–2695); this is the bulk and the only blocker on deleting the
    shadow const.
  - **Wave B+** — the ~21 inline-`defineSchema` describes (2705–4792),
    grouped per coherent feature (CPK eager, count/limit, dup, polymorphic).
- Do NOT fan out into parallel sibling stories; ship one wave, register the next.

## Definition of done

Fidelity is the deliverable. An `eslint-disable` or leaving the file excluded
does **not** close this story. The file leaves the exclude list when the last
wave lands.
