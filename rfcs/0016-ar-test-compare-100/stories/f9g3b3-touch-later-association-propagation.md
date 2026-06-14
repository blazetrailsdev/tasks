---
title: "f9g3b3-touch-later-association-propagation"
status: in-progress
updated: 2026-06-14
rfc: "0016-ar-test-compare-100"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 3294
claim: "2026-06-14T21:44:12Z"
assignee: "f9g3b3-touch-later-association-propagation"
blocked-by: null
---

## Context

Tail of [[f9g3b-persistence-feature-gap-tail]]. The `touch_later_test.rb`
association skips plus `delegated_type_test.rb`'s `touch account` all need
`belongs_to … touch: true` / touch_later propagation through associations —
not implemented in `associations/belongs-to.ts` (touchRecord / TouchLater).

Skipped tests (touch-later.test.ts):

- `touch later an association dont autosave parent` (LineItem→Invoice)
- `touching three deep` (Node/Tree multi-level)
- `touching through nested attributes without before committed on all records`
- `touching through nested attributes with before committed on all records`

The last two also depend on `ActiveRecord.before_committed_on_all_records`.
Mirror the Rails fixtures (invoice/line_item, node/tree, owner/pet).

## Acceptance criteria

- [x] Implement `belongs_to touch:` association touch propagation + touch_later
      through associations; un-skip the four touch-later tests and the
      delegated-type `touch account` test. Test names match Rails verbatim.
- [x] ≤300 LOC; touched files only. Single draft PR from main; run /link.
