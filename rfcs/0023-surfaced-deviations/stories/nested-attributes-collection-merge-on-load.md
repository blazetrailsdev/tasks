---
title: "Nested attributes: collection load merges unsaved nested updates/destroys with DB rows (Rails load_target merge), not async flush"
status: ready
updated: 2026-06-15
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 280
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Carved out of `nested-attributes-sync-existing-record-updates` (RFC
0023-surfaced-deviations). This is the **core architectural** sub-story: the
collection association loader must merge unsaved nested-attribute changes with
the DB rows when it loads, mirroring Rails' `CollectionAssociation#load_target`
(`target_records_from_association` / `merge_target_lists`), which preserves
unsaved in-memory records, scheduled destroy marks, and order rather than
overwriting them with a fresh DB read.

trails currently stores id-bearing nested updates/destroys in
`_pendingNestedAttributes` and flushes them asynchronously **after** save
(`processNestedAttributes` in `packages/activerecord/src/nested-attributes.ts`);
loading the collection proxy does a fresh DB read that does not see the pending
changes. This touches the collection loader in
`packages/activerecord/src/associations.ts` (~2,800 LOC) and the collection
proxy load path, so it is expected to be the largest sub-story and may itself
need a further split if it exceeds 300 LOC.

Depends on the synchronous in-memory target population landing first so there
is an in-memory target to merge against.

## Acceptance criteria

- Un-skip and implement (Rails-verbatim test names — read the Rails test first):
  - "should not overwrite unsaved updates when loading association"
  - "should not remove scheduled destroys when loading association"
  - "should preserve order when not overwriting unsaved updates"
  - "should refresh saved records when not overwriting unsaved updates"
- Collection load merges in-memory/unsaved nested records and destroy marks with
  DB rows, preserving order, instead of overwriting them.
- 300 LOC ceiling. NO STACKED PRs. Single PR from main. If the change is larger
  than 300 LOC, split further via `pnpm tasks new` rather than stacking.
- Test names match Rails verbatim.
