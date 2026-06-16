---
title: "db_warnings_action :raise escalates DB warnings to exceptions"
status: ready
updated: 2026-06-16
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 150
priority: 23
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Surfaced in d2-insert-all-on-duplicate (PR #3442). trails has no
`db_warnings_action` setting nor warning-to-exception escalation, so Rails'
`with_db_warnings_action(:raise) { ... }` test idiom cannot be exercised. The
upsert test that depends on it is left a vacuous no-op and skipped.

Blocks `upsert and db warnings` in
packages/activerecord/src/insert-all.test.ts (currently `it.skip`), mirroring
Rails insert_all_test.rb:360. Broader than insert_all — a connection-config
feature.

## Acceptance criteria

- [ ] A `db_warnings_action` connection setting with a `:raise` mode that
      escalates DB warnings to exceptions.
- [ ] Un-skip `upsert and db warnings` with a faithful
      with_db_warnings_action(:raise) wrapper.
