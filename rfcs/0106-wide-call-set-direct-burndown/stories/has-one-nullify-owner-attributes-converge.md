---
title: "Converge HasOneAssociation#nullify_owner_attributes onto the Rails body"
status: in-progress
updated: 2026-08-21
rfc: "0106-wide-call-set-direct-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: 6815
claim: "2026-08-21T12:20:33Z"
assignee: "remeasure-collection-proxy-residue-after-the-burndown"
blocked-by: null
closed-reason: null
---

# Converge `HasOneAssociation#nullify_owner_attributes` onto the Rails body

## Context

Surfaced while porting the `:destroy_async` arm (RFC 0106 wave 4d). The
has-one shard keeps two `kind: "set"` rows after that PR:

    associations/has-one-association.json  nullify_owner_attributes -> foreign_key, primary_key

Rails (`vendor/rails/activerecord/lib/active_record/associations/has_one_association.rb:119-123`):

    def nullify_owner_attributes(record)
      Array(reflection.foreign_key).each do |foreign_key_column|
        record[foreign_key_column] = nil unless foreign_key_column.in?(Array(record.class.primary_key))
      end
    end

`packages/activerecord/src/associations/has-one-association.ts:655-667` instead
sources its column list from the module-level `nullifiedOwnerAttributes(assoc)`
helper (`:768`), which is the port of the _other_ Rails method
(`ForeignAssociation#nullified_owner_attributes`, `foreign_association.rb:13`).
Two consequences:

- The `foreign_key_column.in?(Array(record.class.primary_key))` guard is
  missing, so a FK column that is also part of the target's primary key gets
  nulled where Rails skips it.
- The trails helper additionally nulls the polymorphic type column, which
  `nullify_owner_attributes` does not touch.

Converging means reading `reflection.foreign_key` directly in
`nullifyOwnerAttributes` and adding the primary-key guard, leaving
`nullifiedOwnerAttributes` for its own two Rails call sites
(`has_one_association.rb:53`, `has_many_association.rb:116`).

## Acceptance criteria

- [ ] `nullifyOwnerAttributes` mirrors `has_one_association.rb:119-123` line for
      line, including the `Array(record.class.primary_key)` guard.
- [ ] Both `nullify_owner_attributes` rows are deleted from
      `scripts/api-compare/call-mismatches-exclude/activerecord/associations/has-one-association.json`
      by hand via `serializeBaseline`, then the shard mark tightened.
- [ ] The polymorphic-type-column behaviour change is checked against the
      has_one / polymorphic tests; any Rails test that pins it is cited.
- [ ] SQLite, PostgreSQL and MySQL/MariaDB lanes green.
