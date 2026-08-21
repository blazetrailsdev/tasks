---
title: "converge-encryption-scheme-tests-onto-real-base-subclasses"
status: ready
updated: 2026-08-21
rfc: "0078-sti-schema-reflection-fidelity"
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

`packages/activerecord/src/encryption/encryption-schemes.test.ts` declares
`encrypts` on `class extends Model` — an **ActiveModel** class. Rails'
`encryption_schemes_test.rb:120-133` and `:166-180` use a real ActiveRecord
model (`Class.new(Author) { self.table_name = "authors"; encrypts :name, ... }`)
and assert through `create!` / `find_by_name`, not through
`type_for_attribute(...).previousTypes`.

The divergence has a cost at the source: `EncryptableRecord` is mixed into
`ActiveRecord::Base` alone (`base.rb:313`), so Rails' decorator can call
`columns_hash` unconditionally (`encryptable_record.rb:91`). trails must spell
that `modelClass.columnsHash?.()` because an `ActiveModel::Model` host has no
`columns_hash` — an optional call that exists only for these test mocks. See the
call site in `encryption/encryptable-record.ts` (`pushEncryptionDecorator`).

Also affected: the two trails-only cases in the same file under
`describe("global previous schemes wiring — config.previous → EncryptableRecord.encrypts")`.

## Acceptance criteria

- [ ] The affected cases declare `encrypts` on a real `Base` subclass over a
      canonical table, mirroring Rails' `Class.new(Author)`.
- [ ] The Rails-named cases assert through the record round-trip Rails asserts
      through (`create!` / `find_by_name`), not through the resolved type's
      `previousTypes`.
- [ ] `pushEncryptionDecorator` calls `columnsHash()` unconditionally, as Rails
      does; the `?.()` optional call is deleted.
- [ ] `encryption/` suites pass.
