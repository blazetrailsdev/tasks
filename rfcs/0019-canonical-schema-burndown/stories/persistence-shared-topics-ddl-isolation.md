---
title: "Restore becomes_default_sti_subclass + reset_column_information_resets_children (shared-topics DDL isolation)"
status: ready
updated: 2026-06-21
rfc: "0019-canonical-schema-burndown"
cluster: null
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

Deferred from `persistence-port-residual-cluster` (RFC 0019). Two
`persistence_test.rb` names need DDL on the shared canonical `topics` table,
reverted in `ensure` — which risks cross-file flake under parallel vitest forks
(see memory `project_shared_db_shape_drift_root_cause`). Needs an isolation
pattern that does not perturb sibling files reading `topics` concurrently.

- `test_becomes_default_sti_subclass` (persistence_test.rb:765):
  `change_column_default :topics, :type, "Reply"` + `Topic.reset_column_information`,
  then `topics(:second).becomes(Topic)` is a `Topic` instance; reverted in
  `ensure`.
- `test_reset_column_information_resets_children` (persistence_test.rb:1537):
  `add_column :topics, :foo, :string` + `Topic.reset_column_information`, then a
  `Class.new(Topic)` child picks up `foo` / `foo_changed?` and
  `child.new(foo: :bar).foo == "bar"`; `remove_column` + reset in `ensure`.

Findings: `resetColumnInformation`
(`packages/activerecord/src/model-schema.ts:676`) already redirects STI subclass
resets to the base and re-derives child accessors, so the child-propagation
mechanics likely work once the DDL is applied. The open question is purely
isolation: how to run shared-`topics` DDL without flaking siblings. Options to
evaluate: a dedicated worker/connection for these tests, a guarded
beforeAll/afterAll canonical rebuild (mirroring the locking.test.ts /
dirty.test.ts `dropExisting` shield), or a separate DB.

## Acceptance criteria

- [ ] Restore both tests verbatim in `persistence.test.ts` with real
      assertions and the DDL revert in a `finally`.
- [ ] Shared-`topics` DDL uses an isolation pattern that provably does not flake
      sibling files under parallel forks.
- [ ] Passes on sqlite/postgres/mysql CI lanes; lint + typecheck clean.
