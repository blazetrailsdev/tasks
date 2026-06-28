---
title: "associations/association-scope.test.ts → canonical schema + association_scope_test.rb"
status: ready
updated: 2026-06-28
rfc: "0019-canonical-schema-burndown"
cluster: fixtures
deps: []
deps-rfc: []
est-loc: 400
priority: 4
pr: null
claim: null
assignee: null
blocked-by: null
---

> **Scope override (RFC 0019 prioritization):** Exempt from the 500-LOC PR
> ceiling per the RFC 0019 per-file convention. At ~1025 LOC this likely fits in
> one PR; if not, split per-describe across sibling PRs off `main` (NOT
> stacked). The file leaves the exclude list only when FULLY converted — the
> lint gate is per-file all-or-nothing.

## Context

`packages/activerecord/src/associations/association-scope.test.ts` (~1025 LOC,
2 `defineSchema` calls) is in the RFC 0019 canonical-schema exclude list with
**no live story**. The top-level `describe("AssociationScope")` already calls
`setupHandlerSuite()`, but the body is dense with **bespoke `class X extends
Base` partial-declaration model pairs** — `AsAuthor`/`AsPost`,
`CountAuthor`/`CountPost`, STI `StiOwner`/`StiBase`, `DsAuthor`/`DsPost`,
`ZeroArityAuthor`/`ZeroArityPost`, polymorphic `PolyTarget`/`PolyComment`, CPK
`CpkAsOwner`/`CpkAsTarget` + `AscCpkBook`/`AscCpkBrokenOrder`, `UuidTarget`/
`UuidComment`, `CcAuthor`, etc. — each backing one scope-construction scenario.

- trails: `associations/association-scope.test.ts`
- Rails: `vendor/rails/activerecord/test/cases/associations/association_scope_test.rb`
  (drives canonical `Author`/`Post`/`Comment` + CPK models through
  `Associations::AssociationScope.scope`).

## Acceptance criteria

- [ ] **Converged setup, not bespoke classes:** ride `setupHandlerSuite()` +
      `useHandlerFixtures([...])` (Rails `fixtures :name`); rows via
      `name(:label)`. A fully converged file calls `defineSchema` **zero** times,
      declares no inline `class X extends Base`, and constructs no
      `createTestAdapter`.
- [ ] Open `association_scope_test.rb` FIRST; port each body word-for-word.
      **Test names UNCHANGED** (`test:compare` matches on names).
- [ ] Replace the bespoke author/post/owner/target pairs with the canonical
      models Rails uses (including the STI, polymorphic, CPK, and UUID families).
      Never fake a column the canonical table lacks; add to
      `test-helpers/test-schema.ts` only when Rails `schema.rb` has it.
- [ ] Tests hitting a genuine impl gap are `it.skip` with a comment referencing
      the gap story (register under `0005-activerecord-gaps` first).
- [ ] File removed from `eslint/require-canonical-schema-exclude.json`;
      `pnpm lint` clean, no `eslint-disable`.
- [ ] `pnpm vitest run packages/activerecord/src/associations/association-scope.test.ts`
      passes.

## Definition of done

Fidelity is the deliverable. An `eslint-disable` or leaving the file excluded
does **not** close this story.
