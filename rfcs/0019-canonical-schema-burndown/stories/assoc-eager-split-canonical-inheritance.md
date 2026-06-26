---
title: "eager.test.ts → canonical: inheritance/STI cluster"
status: claimed
updated: 2026-06-26
rfc: "0019-canonical-schema-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 300
priority: 42
pr: null
claim: "2026-06-26T11:01:49Z"
assignee: "assoc-eager-split-canonical-inheritance"
blocked-by: null
---

> **Scope override (RFC 0019 prioritization, 2026-06-25):** This story is exempt from the 500-LOC PR ceiling. Ship the full file conversion as **one PR per file**, even if additions+deletions exceed 500 LOC. Do **not** split into sibling PRs or defer part of the file to a follow-up story — the goal is to drop the file from the canonical-schema exclude list in a single PR.

## Context

Follow-on wave of `assoc-eager-split-canonical-remaining-clusters` (RFC 0019).
PR #3477 converged the `eager with has many and limit *` cluster of
`packages/activerecord/src/associations/eager.test.ts` onto canonical
Post/Author/Comment/Category fixtures. This story converts the **inheritance / STI** cluster:
the `eager with inheritance / eager has * with association inheritance` tests still declared as ad-hoc per-test models against the inline
`TEST_SCHEMA` in the bespoke `describe("EagerAssociationTest")` block (top of
`eager.test.ts`, ~line 482). Port each body word-for-word from Rails
`activerecord/test/cases/associations/eager_test.rb`.

The file stays in the `require-canonical-schema` exclude list until the FINAL
wave removes the last `defineSchema`; do NOT drop the exclude entry here.

## Acceptance criteria

- [ ] Open `eager_test.rb` first; port each body word-for-word, test names unchanged.
- [ ] Replace bespoke per-test models with canonical registry models + `useHandlerFixtures` + `name(:label)`.
- [ ] Remove the converted bespoke `TEST_SCHEMA` entries; add a canonical column to
      `test-helpers/test-schema.ts` ONLY when Rails `schema.rb` has it (parity-check first).
- [ ] `pnpm lint` clean, no `eslint-disable`. `pnpm vitest run .../eager.test.ts` passes.
- [ ] PR ≤300 LOC, single PR from main, not stacked.
