---
title: "F-9d — autosave_association residuals"
status: draft
updated: 2026-06-10
rfc: "0016-ar-test-compare-100"
cluster: core-residuals
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

From the 2026-06-10 snapshot. `autosave_association_test.rb` carries 11
matched-skips not owned by any story. Skips: `callbacks on child when parent
autosaves child twice` (+ inverse), `should automatically save bang the
associated model if it sets the inverse record`, `store association in two
relations with one save` (×3 variants), `when extra records exist for
associations, validate should not load them up`, `autosave new record with after
create callback and habtm association`.

## Acceptance criteria

- [ ] Un-skip the autosave_association behaviors above (callback ordering on
      repeat autosave, inverse-record save!, two-relation single-save dedup,
      validation not force-loading extras).
- [ ] `autosave_association_test.rb` reaches 0 matched-skips.
- [ ] Touched test files only.

## Notes

Rails: `activerecord/test/cases/autosave_association_test.rb` +
`autosave_association.rb`. Relates to the inverse-of dedup WeakSet
([[project_story_7_5_collection_dedup_already_done]]).
