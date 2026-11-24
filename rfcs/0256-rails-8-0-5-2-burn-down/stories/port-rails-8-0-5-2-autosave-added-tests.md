---
title: "Port the two autosave tests Rails v8.0.5.2 added"
status: done
updated: 2026-11-24
rfc: "0256-rails-8-0-5-2-burn-down"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: trails#10690
claim: "2026-11-24T03:02:06Z"
assignee: "activestorage-image-magick-security-policy"
blocked-by: null
closed-reason: null
---

## Context

Rails v8.0.5.2 added two tests to `activerecord/test/cases/autosave_association_test.rb`. They were missing from the burn-down ledger and trails#10676 did not port them:

- `TestAutosaveAssociationOnAHasOneAssociation#test_should_not_saved_for_unchanged_sti_type_on_polymorphic_association` (`vendor/rails/v8.0.5.2/activerecord/test/cases/autosave_association_test.rb:1807-1840`). It exercises the new `inverse_polymorphic_association_changed?` body (`autosave_association.rb:526-531`, `reflection.active_record.polymorphic_name != class_name`) with an STI subclass of `Human` / `Face` (models `human.rb`, `face.rb`).
- `TestAutosaveAssociationWithNestedAttributes#test_should_be_invalid_when_nested_attributes_deletion_breaks_validation` (`autosave_association_test.rb:2447-2500`). It exercises the new `association_valid?` arm (`autosave_association.rb:377`, `context || record.changed_for_autosave?`) on the `ship_parts` / `ships` / `pirates` tables.

TS: `packages/activerecord/test/cases/autosave-association.test.ts`. The library side already landed in trails#10676.

## Acceptance criteria

- [ ] Both tests are ported with their Rails names verbatim, using canonical tables and models (`Face`, `Human`/`SuperHuman`, `Ship`, `ShipPart`, `Pirate`). The nested-attributes class defines its local `Part` / `Ship` / `Pirate` subclasses as Rails does.
- [ ] Both pass on SQLite, PostgreSQL and MariaDB, and `pnpm parity:test` credits them.
