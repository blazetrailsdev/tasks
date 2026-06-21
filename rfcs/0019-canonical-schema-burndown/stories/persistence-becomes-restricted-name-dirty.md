---
title: "Restore test_becomes_includes_changed_attributes (restricted-name dirty-tracking fidelity)"
status: in-progress
updated: 2026-06-21
rfc: "0019-canonical-schema-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 3834
claim: "2026-06-21T20:46:42Z"
assignee: "persistence-becomes-restricted-name-dirty"
blocked-by: null
---

## Context

Deferred from `persistence-port-residual-cluster` (RFC 0019). Restore
`test_becomes_includes_changed_attributes`
(`vendor/rails/activerecord/test/cases/persistence_test.rb:473`):

```ruby
company = Company.new(name: "37signals")
client  = company.becomes(Client)
assert_equal "37signals", client.name
assert_equal %w{name}, client.changed
```

Blocked on a known fidelity gap (see memory
`project_restricted_name_attribute_no_dirty_track`): trails treats `name` as a
restricted attribute method, so `new Company({ name })` neither dirty-tracks
the assignment (`changedAttributeNamesToSave` returns `[]`, should be
`["name"]`) nor exposes a `.name` reader (read via `readAttribute("name")`).
The `becomes` change-set sharing already landed in the parent destub PR
(`packages/activerecord/src/persistence.ts`) and works for non-restricted
attributes (verified with `metadata`); only the restricted-`name` path is
outstanding.

This is the same convergence blocker that gates other `name`-changed test
ports; fix the restricted-attribute handling so `name` dirty-tracks and exposes
a reader like Rails, rather than reworking the test.

## Acceptance criteria

- [ ] `new Company({ name })` dirty-tracks `name`
      (`changed`/`changedAttributeNamesToSave` include `"name"`) and exposes a
      `.name` reader, matching Rails.
- [ ] Restore `test_becomes_includes_changed_attributes` verbatim in
      `persistence.test.ts` using canonical `Company`/`Client`; real assertions.
- [ ] No regressions in existing restricted-attribute behavior; lint +
      typecheck clean; sqlite/postgres/mysql lanes pass.
