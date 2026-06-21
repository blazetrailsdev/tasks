---
title: "persistence-test-canonical"
status: claimed
updated: 2026-06-21
rfc: "0019-canonical-schema-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-06-21T13:42:45Z"
assignee: "persistence-test-canonical"
blocked-by: null
---

## Context

Sibling wave of persistence-dup-cluster. That story converted the small files
(`clone.test.ts`, `dup.test.ts`) onto the canonical schema; `insert-all.test.ts`
was already canonical. The remaining file is the large one:

- `packages/activerecord/src/persistence.test.ts` (~4662 LOC, still in
  `eslint/require-canonical-schema-exclude.json`) → Rails
  `vendor/rails/activerecord/test/cases/persistence_test.rb`.

It drives canonical Topic/Post/Author/Developer etc. Must be converted off
`defineSchema` onto `setupHandlerSuite()` + `useHandlerFixtures([...])` with
`name(:label)` fixture lookups, matched word-for-word to the Rails bodies.

## Acceptance criteria

- [ ] Convert `persistence.test.ts` to canonical schema + handler fixtures, no
      `defineSchema`, no `eslint-disable`. Test names unchanged.
- [ ] Ship per-`describe` across sibling PRs off `main` (NOT stacked); each PR
      ≤500 LOC. Register further waves as new stories rather than fanning out.
- [ ] Remove `persistence.test.ts` from the exclude JSON once fully converted.
- [ ] `pnpm vitest run packages/activerecord/src/persistence.test.ts` passes;
      `pnpm lint` clean.
