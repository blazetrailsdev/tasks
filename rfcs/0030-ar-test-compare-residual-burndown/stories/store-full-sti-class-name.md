---
title: "store-full-sti-class-name"
status: done
updated: 2026-06-22
rfc: "0030-ar-test-compare-residual-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: 30
pr: 3874
claim: "2026-06-22T12:11:58Z"
assignee: "store-full-sti-class-name"
blocked-by: null
---

## Context

`associations/eager-load-includes-full-sti-class.test.ts` ports Rails
`activerecord/test/cases/associations/eager_load_includes_full_sti_class_test.rb`,
which has four test classes (`FullStiClassNamesTest`, `NonFullStiClassNamesTest`,
`PolymorphicFullClassNamesTest`, `PolymorphicNonFullClassNamesTest`). Each
toggles `ActiveRecord::Base.store_full_sti_class` / `store_full_class_name`
between `true` and `false` (`setup`/`teardown` save and restore the prior value)
and asserts that a polymorphic `taggable` association on a namespaced model
(`Namespaced::Post`, table `posts`, `has_one :tagging, as: :taggable`) resolves
or returns nil depending on whether the stored `taggable_type` column holds the
namespaced (`Namespaced::Post`) or demodulized (`Post`) class name.

trails currently has **no** `storeFullStiClass` / `storeFullClassName` class
attributes. Polymorphic type-column writes always use a single fixed
class-name form, so there is no way to toggle the behavior the tests assert.

Rails refs:

- `activerecord/lib/active_record/model_schema.rb` — `store_full_sti_class`,
  `store_full_class_name` class attributes.
- `activerecord/lib/active_record/inheritance.rb` —
  `sti_class_for` / `polymorphic_class_for` honoring the flags.

## Acceptance criteria

- [x] Add `Base.storeFullStiClass` and `Base.storeFullClassName` class
      attributes (default `true`), inheritable and restorable.
- [x] STI type-column writes and polymorphic `*_type`-column writes honor the
      flags (full namespaced name when `true`, demodulized when `false`).
- [x] Un-skip the 4 deduped tests in
      `associations/eager-load-includes-full-sti-class.test.ts` (8 cases across
      the full/non-full + poly/non-poly variants) and make them pass against the
      canonical SQLite adapter using canonical models + TEST_SCHEMA.
