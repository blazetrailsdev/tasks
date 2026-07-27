---
title: "Resolve the MySQL skip on test_remove_foreign_key_with_restrict_action"
status: draft
updated: 2026-07-27
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`test_remove_foreign_key_with_restrict_action`
(`vendor/rails/activerecord/test/cases/migration/foreign_key_test.rb:446-451`)
was ported in #5450 as
`packages/activerecord/src/migration/foreign-key.test.ts` and had to be gated
with `it.skipIf(adapterType === "mysql")` — it fails on MariaDB.

`MySQL::SchemaStatements#extract_foreign_key_action`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/mysql/schema_statements.rb:224-226`)
is `super unless specifier == "RESTRICT"`, so a foreign key created with
`ON DELETE RESTRICT` reflects back with `on_delete` nil on the MySQL family.
Rails asserts exactly that in `test_add_on_delete_restrict_foreign_key`
(`foreign_key_test.rb:267-278`).

`remove_foreign_key :astronauts, :rockets, on_delete: :restrict` forwards
`on_delete` into `foreign_key_for!` → `defined_for?`, which compares
`Array(nil)` against `["restrict"]` and never matches, so the removal raises
`ArgumentError`. Rails' own test has no MySQL guard, so this is a latent gap
upstream — Rails' suite does not exercise it there, trails' MariaDB job does.

The skip is a deviation from Rails' ungated test and should not stand
indefinitely without a decision.

## Acceptance criteria

- [ ] Decide the end state: upstream the guard to Rails, keep the skip with the
      divergence recorded as permanent, or make the MySQL family round-trip
      `RESTRICT` (and reconcile that with
      `test_add_on_delete_restrict_foreign_key`, which asserts nil).
- [ ] Whatever is chosen, `foreign-key.test.ts` runs the case on every adapter
      where it can pass, and the skip carries the Rails `file:line` for the
      others.
- [ ] Green on all three adapters.
