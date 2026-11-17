---
title: "trailmap: Refinement is a Base record with an attached summary, and the RFC marks fold it in"
status: draft
updated: 2026-11-17
rfc: "0243-trailmap-audits-refinements-activestorage"
cluster: refinements
packages: ["activestorage", "activerecord"]
deps: [rfc-page-refinements-tab, trailmap-configures-active-storage-on-base]
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

**Lands in:** trailmap.

## Context

0136 `rfc-page-refinements-tab` (trailmap#151) adds `RfcRefine extends Hub`
(`app/models/rfc-refine.ts`), with `summary` as a text column
(`db/hub-migrate/20261117000007_create_rfc_refines.ts`). It also adds
`POST /rfc-refines` (`app/controllers/rfc-refines-controller.ts`) and the
`/rfc/:id/refinements` tab. The operator ruled that refinements live on
`Base` with the summary in Active Storage. If #151 is retargeted before it
merges (RFC Open question 1), this story shrinks to the attachment and the
marks.

ringo's report also carries `Stories`, the RFC's story count when the report
landed (btwebooks `webhook/spawnloop.go:209-219`, measured by `rfcStoryCount`
at `:2495`). ringo folds the history into the RFC marks with
`mergeRefineHistory` (`webhook/rfcmarks.go:366-371`). trailmap's
`app/models/concerns/rfc-marks.ts:14-15` says it omits that.

## Acceptance criteria

- [ ] The model (`Refinement`, or `RfcRefine` per Open question 1) extends
      `ApplicationRecord` on `Base`, with `rfc_id`, `outcome` (validated as
      `RFC_REFINE_OUTCOMES`), `stories` and `hasOneAttached("summary")`. The
      Hub table and migration are removed, the `db/migrate` mirror and
      `db/schema.ts` are added, and `tableOwners` gains the table →
      `trailmap`.
- [ ] `POST /rfc-refines` attaches `summary` (`text/markdown`), records
      `stories` from the RFC's story count, and accepts an optional `when`
      that becomes `created_at` (for the import).
- [ ] The Refinements tab renders the attachment's text as markdown, as #151's
      column did.
- [ ] `rfc-marks.ts` folds refinement rows into the marks as
      `mergeRefineHistory` does, preferring a measured `stories` over
      reconstruction, and the omission note at `:14-15` is deleted.
- [ ] Controller tests cover a populated tab, an empty tab and a POST round
      trip. Both apps (TS and `rails/`) agree. Screenshots of the tab are in
      the PR.
