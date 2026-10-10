---
title: "migration-inherited-raise-on-direct-inheritance-has-no-carrier"
status: draft
updated: 2026-10-10
rfc: "0174-activerecord-api-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActiveRecord::Migration.inherited` (`vendor/rails/v8.0.2/activerecord/lib/active_record/migration.rb:617-626`) raises
`StandardError` "Directly inheriting from ActiveRecord::Migration is not supported. Please specify the
Active Record release the migration was written for: …" when `subclass.superclass == Migration`.

trails has no carrier for it. The hook audit in trails#8749 mapped the other 13 skipped activerecord
hooks; this is the one left. JS has no definition-time hook, so the only seat is a deferred one (the
constructor, or `MigrationProxy#load_migration`), and trails migrations extend `Migration` directly by
design: the generator templates in
`packages/trailties/src/generators/active-record/migration/templates/` emit `extends Migration`, and
about 173 classes under `packages/*/src` do the same.

Versioned migration compatibility (`Migration[x.y]`, `Compatibility::V*`) was ruled out of scope by the
repo owner on 2026-07-22 (trails#5070 closed unmerged). That ruling may make this hook permanently
unported; it has not been ruled on by name.

## Acceptance criteria

- [ ] The owner rules whether a direct `extends Migration` raises as Rails does.
- [ ] If it does: the raise is seated with Rails' message, the generator templates and in-repo migrations extend the versioned class, and "Directly inheriting" is covered by a test.
- [ ] If it does not: this story closes `PERMANENT:` and the ruling is recorded in `packages/activerecord/CLAUDE.md`.
