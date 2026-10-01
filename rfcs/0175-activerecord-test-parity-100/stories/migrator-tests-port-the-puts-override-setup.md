---
title: "Migrator test setup: port the Migration#puts override that silences output and counts messages"
status: draft
updated: 2026-10-01
rfc: "0175-activerecord-test-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' migrator test classes silence migration output in `setup` by redefining `Migration#puts` to bump `ActiveRecord::Migration.message_count`, and restore it in `teardown`:

- `vendor/rails/v8.0.2/activerecord/test/cases/multi_db_migrator_test.rb:46-54` (setup) and `:57-69` (teardown)
- `vendor/rails/v8.0.2/activerecord/test/cases/migrator_test.rb:29-35` (setup) and `:38-47` (teardown)

trails' ports drop that arm. `packages/activerecord/src/multi-db-migrator.test.ts` has no counterpart at all, and `packages/activerecord/src/migrator.test.ts:82-95` saves and restores `Migration.verbose` only. The consequence is visible: "internal metadata stores environment" (`multi-db-migrator.test.ts`, ported in trails#8331, and its sibling in `migration.test.ts:476`) prints the `valid` migrations' `== 1 ValidPeopleHaveLastNames: migrating ==` progress lines into the test run, where Rails prints nothing.

`Migration#write` is the trails port of the `puts` call site (`packages/activerecord/src/migration.ts:923`, Rails `migration.rb` `def write(text = ""); puts(text) if verbose; end`).

## Acceptance criteria

- [ ] `multi-db-migrator.test.ts` and `migrator.test.ts` setup/teardown mirror Rails: `Migration.messageCount = 0` and the `puts` override in setup, restored in teardown, at the seam `Migration#write` writes through.
- [ ] If `Migration.message_count` / the `puts` seam is not ported in `migration.ts`, port it at the Rails name (`migration_test.rb` / `migrator_test.rb` read `ActiveRecord::Migration.message_count`).
- [ ] The migrator test files emit no migration progress output.
- [ ] `pnpm parity:test` and `pnpm parity:test:assertions` deltas non-negative.
