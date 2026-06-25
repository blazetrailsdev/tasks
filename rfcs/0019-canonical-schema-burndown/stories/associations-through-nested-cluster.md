---
title: "through / nested-through associations → canonical schema + Rails fixtures"
status: ready
updated: 2026-06-25
rfc: "0019-canonical-schema-burndown"
cluster: fixtures
deps: ["associations-collection-cluster"]
deps-rfc: []
est-loc: 500
priority: 72
pr: null
claim: null
assignee: null
blocked-by: null
---

> **Scope override (RFC 0019 prioritization, 2026-06-25):** This story is exempt from the 500-LOC PR ceiling. Ship the full file conversion as **one PR per file**, even if additions+deletions exceed 500 LOC. Do **not** split into sibling PRs or defer part of the file to a follow-up story — the goal is to drop the file from the canonical-schema exclude list in a single PR.

## Context

Convert the nested-through association family onto the canonical schema. Owns
the Rails-backed file plus the trails-internal nested-through harnesses:

- `associations/nested-through-associations.test.ts` (~2853 LOC, 60 tbl) →
  `associations/nested_through_associations_test.rb`
- `associations/nested-through-advanced.test.ts` (~322 LOC, 8 tbl) — internal,
  no Rails counterpart (step 4 N/A)
- `associations/nested-through-preloader.test.ts` (~241 LOC, 4 tbl) — internal,
  no Rails counterpart (step 4 N/A)
- `associations/polymorphic-sti-through.test.ts` (~332 LOC, 5 tbl) — internal
- `associations/through-association-scope.test.ts` (~116 LOC, 3 tbl) — internal
- `associations/source-type-validation.test.ts` (~264 LOC, 4 tbl) — internal

Rails drives `Author`/`Post`/`Tagging`/`Tag`/`Category`/`Member`/`Organization`
nested `:through` chains — all canonical.

## Acceptance criteria

- [ ] **Converged setup, not `defineSchema`:** wire the file with
      `setupHandlerSuite()` + `useHandlerFixtures([...])` (Rails `fixtures :name`);
      load rows via `name(:label)` registry lookups. The canonical tables are
      pre-built once per worker by `template-global-setup.ts`, so a converged
      file calls `defineSchema` **zero** times and constructs no
      `createTestAdapter`.
- [ ] For the Rails-backed file: open `nested_through_associations_test.rb`
      FIRST; port each body word-for-word. Test names unchanged.
- [ ] Internal files: ride `TEST_SCHEMA` + canonical models + fixtures with no
      inline tables (step 4 N/A — no body to match).
- [ ] No `defineSchema` left in the file. If a needed column has no canonical
      home, add it to `test-helpers/test-schema.ts` ONLY when Rails `schema.rb`
      has it (parity-check first); otherwise keep a single scoped, file-unique
      `defineSchema` + teardown for that one table (never the shared name).
- [ ] Each file removed from the exclude JSON; `pnpm lint` clean, no
      `eslint-disable`.
- [ ] `pnpm vitest run <each file>` passes.

## Notes

- The Rails-backed file alone is ~2853 LOC, 60 tables: multi-PR, split
  per-describe across sibling PRs off `main` (NOT stacked). Register remaining
  waves as new stories — do not fan out yourself.

## Definition of done

Fidelity is the deliverable for the Rails-backed file; internal files ride the
canonical schema with no inline tables. An `eslint-disable` or leaving a file
excluded does **not** close this story.
