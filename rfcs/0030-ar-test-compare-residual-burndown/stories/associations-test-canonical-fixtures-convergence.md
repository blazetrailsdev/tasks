---
title: "Convert associations.test bespoke models to canonical fixtures (subselect/references/limitable)"
status: claimed
updated: 2026-06-15
rfc: "0030-ar-test-compare-residual-burndown"
cluster: associations
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: "2026-06-15T23:34:27Z"
assignee: "associations-test-canonical-fixtures-convergence"
blocked-by: null
---

## Context

Surfaced during RFC 0030 story a6-inverse-and-association-tail (PR #3411).
Three newly un-skipped tests in `packages/activerecord/src/associations.test.ts`
use bespoke per-test models + `defineSchema` tables instead of the canonical
Rails fixtures the upstream tests use:

- `subselect` invents `ss_authors` / `ss_author_favorites` (bespoke `SsAuthor` /
  `SsAuthorFavorite`); Rails uses canonical `Author` / `AuthorFavorite` and the
  `author_favorites` fixtures (associations_test.rb:62).
- `association with references` invents `awr_firms` / `awr_clients`; Rails uses
  `companies(:first_firm)` → `Firm#association_with_references` (associations_test.rb:142).
- `using limitable reflections helper` invents `ulr_tags` / `ulr_taggings` /
  `ulr_things`; Rails uses canonical `Tagging` / `Tag` / `Developer` reflections
  (associations_test.rb:132).

Bespoke style was retained because importing the canonical `Tag` / `Tagging` /
`Developer` models into `associations.test.ts` registered models that collided
with the file's existing bespoke `Tag` / `Developer` definitions and broke 7
unrelated passing tests (HABTM, dependence, polymorphic-as). Converging this
file to canonical fixtures is a fidelity cleanup that needs the whole file's
bespoke models reconciled, not a per-test swap.

## Acceptance criteria

- [ ] Reconcile `associations.test.ts` bespoke models so canonical `Author` / `AuthorFavorite`, `Firm` / `Client`, and `Tagging` / `Tag` / `Developer` can be imported without registry collisions.
- [ ] Rewrite `subselect`, `association with references`, and `using limitable reflections helper` against canonical models + real fixture lookups (`useHandlerFixtures`).
- [ ] All three tests still pass; no regressions in the rest of the file.
