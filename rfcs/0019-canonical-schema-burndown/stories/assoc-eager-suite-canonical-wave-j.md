---
title: "assoc-eager-suite-canonical-wave-j"
status: done
updated: 2026-06-29
rfc: "0019-canonical-schema-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 4261
claim: "2026-06-29T11:10:11Z"
assignee: "assoc-eager-suite-canonical-wave-j"
blocked-by: null
---

## Context

Continuation of `assoc-eager-suite-canonical-wave-i` (RFC 0019). Wave I
converged the `Cpk*` (3 cpk preload tests → canonical `CpkOrder`/`CpkBook`/
`CpkOrderAgreement`), `Dp*` (deep preload → canonical `Post.preload(author:
:posts, comments: :post)`), and `Psta*` (preloading the same association twice →
canonical `Member.preload(:currentMembership).includes(currentMembership: :club)`)
clusters in `packages/activerecord/src/associations/eager.test.ts`, removed their
`TEST_SCHEMA` entries, and registered the canonical cpk models in the first
block's `beforeAll`.

Remaining bespoke inline classes / shared models in the first describe block to
converge:

- `ElmarMentor`/`ElmarDeveloper`/`ElmarContract`/`ElmarProject`/
  `ElmarProjectDeveloper` ("eager load multiple associations with references" —
  `eager_test.rb:1398`; canonical `Mentor`/`Developer`/`Contract`/`Project`
  HABTM developers + `references(:mentors)` double-nested includes; may surface
  an eager-load impl gap).
- `Idup*` ("including duplicate objects from has many" — `eager_test.rb:282`;
  categories/posts/comments through HABTM via canonical `Category`/
  `Categorization`/`Post`/`Comment`).
- `Alar*` ("associations loaded for all records" — `eager_test.rb:295`; canonical
  `Category` + `Post` + `SpecialComment`).
- The shared `Sg*` sponsorable models + `seedSponsors()` /
  `registerSponsorableModels()` (sg\_\* TEST_SCHEMA entries) used by the 3
  "preloading through a polymorphic association ..." tests
  (`eager_test.rb:1652`+); converge to canonical `Sponsor` + `Member`/`Author`/
  `Membership` polymorphic preload over the `sponsors` fixture.

Once ALL first-block bespoke inline classes are gone (note the wave-H clusters —
`EagerLeo*`/`EagerLmo*`/`EagerLn*`/`PrePoly*`/`EagerReord*`/`Jeeo*`/`Ewc*`/
`Phmt*` — must also have landed via PR #4258), remove `defineSchema(TEST_SCHEMA)`
from the first block's `beforeAll`, delete the `TEST_SCHEMA` constant, and drop
`eager.test.ts` from `eslint/require-canonical-schema-exclude.json`.

Key Rails reference:
`vendor/rails/activerecord/test/cases/associations/eager_test.rb`.

## Acceptance criteria

- Remaining first-block bespoke inline classes converted to canonical models +
  fixtures (or deleted, for trails-only deviation tests).
- Test names match Rails verbatim; camelCase; no `node:` / `process.`
  references; async fs only.
- All tests pass; net skip delta documented with un-skip story.
- LOC <= 500 per PR; multiple waves allowed.
- BigInt-safe: coerce `id`/`maximum()` with `Number(...)` before arithmetic or
  sort comparators.
