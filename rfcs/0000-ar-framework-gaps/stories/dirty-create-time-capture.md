---
title: "Create-time dirty capture for mass-assigned attributes"
status: ready
updated: 2026-06-04
rfc: "0000-ar-framework-gaps"
cluster: dirty-tracking
deps: []
deps-rfc: []
est-loc: 60
priority: 40
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

From `dirty-test-framework-gaps.md` (PR #2913 port of Rails `dirty_test.rb`).
Constructor / `create` mass-assigned attributes aren't recorded as changes on a
new record, so they're absent from `saved_changes` / `previous_changes` /
partial-insert. Post-construction setters already track; only `new Model({...})`
/ `create({...})` mass-assign doesn't. **Highest yield.**

## Acceptance criteria

- [ ] Mass-assigned attrs (`new`/`create({...})`) are recorded as create-time
      changes, mirroring `ActiveModel::Dirty`.
- [ ] Un-skips in `dirty.test.ts`: `saved_change_to_attribute?`,
      `saved_change_to_attribute`, `attribute_before_last_save`,
      `saved_changes returns a hash…`, `previous changes`, `partial insert` (6).
- [ ] Also resolves the PG-only "save-managed columns absent from saved_changes
      after INSERT" family (§Deferred adapter-inconsistent) where feasible.

## Notes

Rails: `dirty_test.rb` + `active_model/dirty.rb`. Touches core dirty-tracking on
the new-record path — separate PR, not a test rewrite.
