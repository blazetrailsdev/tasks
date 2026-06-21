---
title: "persistence-test-canonical-wave2"
status: in-progress
updated: 2026-06-21
rfc: "0019-canonical-schema-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 3794
claim: "2026-06-21T14:06:47Z"
assignee: "persistence-test-canonical-wave2"
blocked-by: null
---

## Context

Continuation of `persistence-test-canonical`. That story converted the FIRST
`describe("PersistenceTest")` block (lines ~30-347 of
`packages/activerecord/src/persistence.test.ts`) off `defineSchema` onto
`useHandlerFixtures(["topics", "minimalistics", "clothingItems"])` with the
canonical `Topic`/`Minimalistic`/`ClothingItem` models, named fixture accessors
(`topics("first")`, `clothingItems("green_t_shirt")`), and dropped the
`Reply`/`SillyReply`/`UniqueReply`/`SillyUniqueReply` STI registration so
`Topic#destroy` resolves its reply associations.

The remaining ~21 `describe("PersistenceTest")` blocks in the same file still
use bespoke `defineSchema({...})` + inline `class Topic extends Base` /
`class Minimal` declarations. They target the rest of
`vendor/rails/activerecord/test/cases/persistence_test.rb` (1676 LOC).

Key gotchas already discovered (carry forward):

- Import canonical `Topic` UNDER AN ALIAS (`Topic as CanonicalTopic`) and rebind
  it to a local `const Topic` inside each converted describe. A top-level `Topic`
  binding makes esbuild rename the bespoke in-function `class Topic` in the
  still-bespoke blocks to `Topic2`, so their tables resolve to the non-existent
  `topic2s`. Once ALL blocks are converted the alias can collapse back.
- The `blazetrails/test-fixture-parity` lint rule (eslint/test-fixture-parity.mjs)
  hard-errors any test whose Rails counterpart uses fixtures unless the test body
  CALLS a named accessor destructured from `useHandlerFixtures([...])`. A `.first()`
  query does NOT satisfy it, and an `as` cast on the `useHandlerFixtures(...)` call
  breaks the rule's AST detection (parent becomes TSAsExpression). Use the typed
  named-array overload bare: `const { topics } = useHandlerFixtures([...], {...})`.
- Fixture registry keys are camelCase (`clothingItems`, not `clothing_items`).

## Acceptance criteria

- [ ] Convert the remaining `describe("PersistenceTest")` blocks in
      `persistence.test.ts` off `defineSchema` onto canonical schema + handler
      fixtures, matched to the Rails bodies. Test names unchanged.
- [ ] Ship per-`describe` across sibling PRs off `main` (NOT stacked); each PR
      ≤500 LOC. Register further waves as new stories if more than one PR remains.
- [ ] Remove `persistence.test.ts` from
      `eslint/require-canonical-schema-exclude.json` once FULLY converted (no
      `defineSchema`, no `eslint-disable`).
- [ ] `pnpm vitest run packages/activerecord/src/persistence.test.ts` passes;
      `pnpm lint` and `node scripts/typecheck.mjs` clean.
