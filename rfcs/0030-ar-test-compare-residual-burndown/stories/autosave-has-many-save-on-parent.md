---
title: "Autosave persists built has_many children on owner save"
status: in-progress
updated: 2026-06-15
rfc: "0030-ar-test-compare-residual-burndown"
cluster: associations
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 3414
claim: "2026-06-15T22:52:26Z"
assignee: "autosave-has-many-save-on-parent"
blocked-by: null
---

## Context

Surfaced during RFC 0030 story a6-inverse-and-association-tail. The
`save on parent saves children` test in
`packages/activerecord/src/associations.test.ts` stays `it.skip`. Rails:
`Developer.create(name: "Bryan", salary: 50_000)` then
`developer.reload.audit_logs.size == 1` — the autosave path must persist the
has_many child that the model's `log=`/`before_create` built. Needs autosave of
built has_many children through the owner save.

Rails ref: `vendor/rails/activerecord/test/cases/associations_test.rb`
(`test_save_on_parent_saves_children`); `vendor/rails/activerecord/test/models/developer.rb`.

## Acceptance criteria

- [ ] Autosave persists built has_many children when the owner is saved.
- [ ] Un-skip `save on parent saves children`; it passes.
