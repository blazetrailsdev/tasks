---
title: "associations.test.ts → canonical schema + associations_test.rb (multi-wave)"
status: done
updated: 2026-06-28
rfc: "0019-canonical-schema-burndown"
cluster: fixtures
deps: []
deps-rfc: []
est-loc: 500
priority: 5
pr: 4238
claim: "2026-06-28T18:06:34Z"
assignee: "assoc-associations-suite-canonical"
blocked-by: null
---

> **Scope override (RFC 0019 prioritization):** Exempt from the 500-LOC PR
> ceiling per the RFC 0019 per-file convention, but ~2900 LOC is multi-PR.
> Convert in **sequential waves**, single-owner, each wave a ≤500-LOC PR off
> `main` (NOT stacked, NOT parallel sibling stories). The file leaves the
> exclude list only when the FINAL wave delists it — the lint gate is per-file
> all-or-nothing. Register the next wave with `pnpm tasks new` before the PR
> merges.

## Context

`packages/activerecord/src/associations.test.ts` (~2907 LOC) is in the RFC 0019
canonical-schema exclude list with **no live story**. Only 2 `defineSchema`
calls remain, but the bespoke surface is in **many inline `class X extends
Base` partial-declaration models** spread across the describe blocks —
`CpkOrder`/`CpkOrderItem` (`AssociationsTest`, @72), `AnimalsBase` + a large
`PK*`/`PTL*` author/post cluster (`PreloaderTest`, @429–1700), `DifferentPerson`/
`PeopleList`/`OaArgTest`/`ModelAssociatedToClassesThatDoNotExist`
(`OverridingAssociationsTest`, @1714), and `Post` redeclarations in
`GeneratedMethodsTest` / `WithAnnotationsTest`.

Note the known **PreloaderTest taggings registry leak** (see memory
`preloadertest_taggings_registry_leak`): the bespoke sourceless `Tagging` here
leaks into the global registry and collides with
`nested-through-associations.test.ts` under parallel forks. Converging to
canonical models is the durable fix for that flake.

- trails: `associations.test.ts`
- Rails: `vendor/rails/activerecord/test/cases/associations_test.rb` (plus the
  describe-matched Rails classes: `AssociationsTest`, `AssociationProxyTest`,
  `PreloaderTest` (`associations/preloader_test.rb`), `OverridingAssociationsTest`,
  `GeneratedMethodsTest`).

## Acceptance criteria

- [ ] **Converged setup, not bespoke classes:** wire each converted describe
      with `setupHandlerSuite()` + `useHandlerFixtures([...])` (Rails
      `fixtures :name`); load rows via `name(:label)` registry lookups. A fully
      converged file calls `defineSchema` **zero** times, declares no inline
      `class X extends Base`, and constructs no `createTestAdapter`.
- [ ] Open the matching Rails test FIRST; port each body word-for-word. **Test
      names UNCHANGED** (`test:compare` matches on names).
- [ ] Replace inline partial-declaration models with the canonical models Rails
      uses (`Author`/`Post`/`Comment`/`Tag`/`Tagging`/`Cpk::*`/STI families).
      Never fake a column the canonical table lacks; add to
      `test-helpers/test-schema.ts` only when Rails `schema.rb` has it.
- [ ] Tests hitting a genuine impl gap are `it.skip` with a comment referencing
      the gap story (register under `0005-activerecord-gaps` first).
- [ ] File removed from `eslint/require-canonical-schema-exclude.json` only once
      FULLY converted; `pnpm lint` clean, no `eslint-disable`.
- [ ] `pnpm vitest run packages/activerecord/src/associations.test.ts` passes
      (co-run `nested-through-associations.test.ts` under `maxForks=1` to prove
      the taggings-leak flake is resolved).

## Notes

- Suggested wave seams by describe: (A) `PreloaderTest` (the largest + the
  flake source), (B) `AssociationsTest` + `AssociationProxyTest`, (C)
  `OverridingAssociationsTest` + `GeneratedMethodsTest` + `WithAnnotationsTest`.
- Do NOT fan out into parallel sibling stories; ship one wave, register the next.

## Definition of done

Fidelity is the deliverable. An `eslint-disable` or leaving the file excluded
does **not** close this story. The file leaves the exclude list when the last
wave lands.
