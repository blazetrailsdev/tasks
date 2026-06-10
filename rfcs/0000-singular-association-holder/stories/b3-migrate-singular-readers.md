---
title: "Migrate counter-cache / validation / autosave / persistence readers"
status: draft
updated: 2026-06-10
rfc: "0000-singular-association-holder"
cluster: associations
deps: ["b1-singular-association-holder"]
deps-rfc: []
est-loc: 200
priority: 3
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

After b1 the singular target lives on the holder, but several non-association
modules still read `_cachedAssociations` directly. They must route through
`association(name)` / the holder before `_cachedAssociations` can be deleted (b4).
None are has_many-specific after RFC 0006.

## Acceptance criteria

- [ ] `update_counters` belongs_to owner fast-path (`associations.ts:2240`)
      reads the holder instead of `_cachedAssociations.get(...)`; the stale-target
      PK guard is preserved.
- [ ] Validation association-helpers (`validations/association-helpers.ts:10`,
      `validations.ts:187`) read through the holder / `association(name)`.
- [ ] Autosave `_loadedAssociation` (`autosave-association.ts:86`) drops the
      `_cachedAssociations?.has(name)` branch; the existing proxy / built-record /
      preloaded checks cover the remaining cases.
- [ ] `persistence` reload (`persistence.ts:1098–1374`) no longer clears/copies
      `_cachedAssociations`; reload resets the holder / proxy instead.
- [ ] Counter-cache, validation, autosave, and persistence/reload suites pass;
      no test renames.
- [ ] `api:compare` delta non-negative on `counter_cache.rb`,
      `autosave_association.rb`, `validations/associated.rb`, `persistence.rb`.

## Notes

The `i18n-validation` / `association-validation` test pokes seed
`_cachedAssociations` with `FakeTopic`-style undeclared classes; those move with
b4's poke migration, but verify here that the production readers no longer
depend on the map. Rails source: `counter_cache.rb` (`update_counters`),
`autosave_association.rb` (`association_instance_get`), `validations/associated.rb`.
