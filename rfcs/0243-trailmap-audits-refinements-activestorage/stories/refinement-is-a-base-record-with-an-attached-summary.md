---
title: "trailmap: Refinement is a Base record with an attached summary, and the RFC marks fold it in"
status: ready
updated: 2026-11-18
rfc: "0243-trailmap-audits-refinements-activestorage"
cluster: refinements
packages: ["activestorage", "activerecord"]
deps:
  [
    rfc-page-refinements-tab,
    trailmap-configures-active-storage-on-base,
    trailmap-ingest-token-guards-create-endpoints,
  ]
deps-rfc: []
est-loc: 300
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
`Base` with the summary in Active Storage. #151 merged on 2026-11-17 with the
table on Hub, so this story moves it (RFC Decision 1): Hub `rfc_refines` →
Base `refinements`, `RfcRefine` → `Refinement`. The Base table itself is
created by the tasks CLI's migration
(`tasks-cli-migrates-audit-refinement-and-active-storage-tables`); this story
drops the Hub side and moves its rows. The operator wants this path to
exercise the migration machinery on changes (a drop, a rename, a data move),
not only additions.

ringo's report also carries `Stories`, the RFC's story count when the report
landed (btwebooks `webhook/spawnloop.go:209-219`, measured by `rfcStoryCount`
at `:2495`). ringo folds the history into the RFC marks with
`mergeRefineHistory` (`webhook/rfcmarks.go:366-371`). trailmap's
`app/models/concerns/rfc-marks.ts:14-15` says it omits that.

## Acceptance criteria

- [ ] `Refinement` extends `ApplicationRecord` on `Base`, with `rfc_id`,
      `outcome` (validated as `RFC_REFINE_OUTCOMES`), `stories` and
      `hasOneAttached("summary")`; the text column is dropped. The
      `db/migrate` mirror and `db/schema.ts` match the tasks CLI's
      migration, and `tableOwners` has `refinements` → `trailmap`.
- [ ] A new `db/hub-migrate` migration (and its `rails/` twin) copies every
      `rfc_refines` row into `refinements`, attaching its `summary` text and
      keeping `created_at`, then drops `rfc_refines`. Its `down` recreates
      the Hub table and copies the rows back. A test runs `up` then `down`
      on a seeded row and compares. The applied `20261117000007` migration
      is not edited.
- [ ] `RfcRefine` and `rfc-refine.ts` are gone. Every reference (the
      controller, the tab, `rfc-list-ticks-fold-in-stored-refine-reports`'s
      cited code) names `Refinement`. The `/rfc-refines` route stays, since
      both writers post there.
- [ ] `POST /rfc-refines` requires the ingest token and attaches `summary` (`text/markdown`), records
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
