---
title: "anonymous-migration-class-name-is-empty-string-not-nil"
status: draft
updated: 2026-09-28
rfc: "0155-assertion-surfaced-port-bugs"
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

Surfaced porting `compatibility_test.rb` (trails#8206). Rails' `Migration#initialize(name = self.class.name, version = nil)`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/migration.rb:800`) gives an anonymous
`Class.new(ActiveRecord::Migration[6.0])` a `nil` name, and `Migrator#validate`
(`migration.rb`, `raise DuplicateMigrationNameError.new(name) if name`) skips a
`nil` group. So `test_add_reference_on_6_0` (`test/cases/migration/compatibility_test.rb:459-487`)
migrates two anonymous migrations.

trails' `Migration#name` (`packages/activerecord/src/migration.ts:801`) is
`this._name ?? this.constructor.name`, which is `""` for an anonymous class, and
`Migrator#validate` (`migration.ts:1873`) raises
`DuplicateMigrationNameError: Multiple migrations have the name .`

## Acceptance criteria

- [ ] An anonymous migration class's `name` answers `nil` (`null`) as `self.class.name` does, and `validate` skips it.
- [ ] Port `add reference on 6 0` into `packages/activerecord/src/migration/compatibility.test.ts`.
