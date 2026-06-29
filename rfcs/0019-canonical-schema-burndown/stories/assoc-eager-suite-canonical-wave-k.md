---
title: "assoc-eager-suite-canonical-wave-k"
status: in-progress
updated: 2026-06-29
rfc: "0019-canonical-schema-burndown"
cluster: null
deps:
  - assoc-eager-suite-canonical-wave-h
  - assoc-eager-suite-canonical-wave-i
  - assoc-eager-suite-canonical-wave-j
deps-rfc: []
est-loc: null
priority: null
pr: 4278
claim: "2026-06-29T15:06:50Z"
assignee: "assoc-eager-suite-canonical-wave-k"
blocked-by: null
---

## Context

Final cleanup wave after `assoc-eager-suite-canonical-wave-j` (RFC 0019). Wave J
converged the last shared/inline bespoke clusters in the **first** describe block
of `packages/activerecord/src/associations/eager.test.ts`:
`Elmar*` → canonical `Mentor`/`Developer`/`Contract`/`Project`; `Idup*` and
`Alar*` → canonical `Category`/`Post`/`Comment`/`SpecialComment` over the
`categories` fixtures; and the `Sg*` sponsorable models + `seedSponsors()` /
`registerSponsorableModels()` → canonical `Sponsor` + `Member`/`Author`
polymorphic preload over the `sponsors` fixture. Their `TEST_SCHEMA` entries were
removed.

The first block's `beforeAll` still calls `defineSchema(TEST_SCHEMA)` and the
`TEST_SCHEMA` constant still holds entries for the wave-H clusters
(`eager_leo_*`/`eager_lmo_*`/`eager_ln_*`/`pre_poly_*`/`eager_reord_*`/`jeeo_*`/
`ewc_*`/`phmt_*`) and the wave-I clusters (`cpk_*`/`dp_*`/`psta_*`) — because PR
4258 (wave H) and PR 4259 (wave I) had not yet merged when wave J landed, so
those inline classes were still present in the base.

## Acceptance criteria

- Verify NO bespoke inline model classes remain in the first `EagerAssociationTest`
  describe block (waves H, I, J all merged).
- Remove `defineSchema(TEST_SCHEMA)` from the first block's `beforeAll`, delete the
  `TEST_SCHEMA` constant and the now-unused `defineSchema`/`Schema` import.
- Drop `eager.test.ts` from `eslint/require-canonical-schema-exclude.json`.
- All tests in the file pass; lint (`blazetrails/require-canonical-schema`) passes.
- If H/I have NOT merged yet, this story stays blocked — do not partially remove.
