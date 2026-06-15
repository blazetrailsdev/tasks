---
title: "Infer STI at instantiate from the reflected inheritance column"
status: in-progress
updated: 2026-06-15
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: 3329
claim: "2026-06-15T11:35:10Z"
assignee: "infer-sti-at-instantiate-from-reflected-column"
blocked-by: null
---

## Context

Follow-up to `inheritance-column-default-type-and-has-attribute-gate` (PR #3302),
which converged the `new`-from-attributes STI dispatch onto Rails' column-aware
`_has_attribute?(inheritance_column)` gate (`subclassFromAttributesForNew`,
`packages/activerecord/src/inheritance.ts:759`) and defaulted `inheritance_column`
to `"type"` (mirrors `class_attribute :inheritance_column, default: "type"`,
`vendor/rails/activerecord/lib/active_record/model_schema.rb:172`).

It left the **database-row dispatch path** gated on a trails-only sentinel rather
than Rails' column-aware/structural checks:

- `usingSingleTableInheritance` (`inheritance.ts:592`) short-circuits on
  `stiEnabled(modelClass)` (`inheritance.ts:244`, `= _inheritanceColumn != null`)
  before the column-aware gate. Rails `using_single_table_inheritance?`
  (`vendor/rails/.../inheritance.rb:307-308`) has **no** such guard.
- `Base.instantiate` (`packages/activerecord/src/base.ts:2325`) gates the STI
  delegation on `stiEnabled(stiBase)` for the same reason.
- `insert_all`'s `resolveSti` (`packages/activerecord/src/insert-all.ts:309`) is
  already converged onto `isDescendsFromActiveRecord` (Rails `insert_all.rb:106`
  `return if model.descends_from_active_record?`) but is still keyed off the
  `_inheritanceColumn` sentinel transitively via `isStiSubclass`'s prototype walk
  (Rails `descends_from_active_record?` `inheritance.rb:82` is structural).

Consequence: a canonical model whose table reflects a `type` column (`Company`,
`Post`, `Comment`, `Topic`, `Category`, `ClothingItem`) hydrates rows as the base
class on `find`/`all` where Rails hydrates the STI subclass. So
`Company.new(type: "Firm")` returns a `Firm` while `Company.find(id)` for the same
row returns a `Company` — an internal inconsistency this story closes.

### Why scoped out of #3302

Applying the column-aware gate to the row path turned the
`fixtureRegistry seeds against TEST_SCHEMA` conformance test red
(`packages/activerecord/src/test-helpers/use-fixtures.test.ts:743`, assertion `:759`):

1. **Global-registry ambiguity.** `discriminateClassForRecord` (`inheritance.ts:568`)
   resolves via `findStiClass` → the global `modelRegistry`, where bare names
   (`SpecialPost`, `Reply`, `Firm`) collide across test models, raising
   `SubclassNotFound: X is not a subclass of Y`. Rails has unique constants + the
   `inherited` hook (`inheritance.rb:287`) auto-tracking `descendants`; trails has
   no `inherited` hook. Fix: a registry-safe subtree-scoped resolver (row-path
   analogue of `findStiClassInHierarchy`, `inheritance.ts:732`), which needs the
   canonical hierarchies wired with `registerSubclass` like `Company`
   (`packages/activerecord/src/test-helpers/models/company.ts`).
2. **Downstream faults (surface once dispatch is enabled; likely independent):**
   - Seeding `companies` (type `Firm`/`Client`) trips `'0' is not a valid status` —
     `companies.status` defaults to integer `0`
     (`packages/activerecord/src/test-helpers/test-schema.ts:457`); the enum cast on
     the STI-dispatched subclass rejects it.
   - Seeding `comments` as `SpecialComment` resolves the `company` belongs-to
     (`comment.ts`, `belongsTo("company", ...)`) whose `Company` model is not loaded
     in the isolated pass → `Model 'Company' not found in registry`.

### Scope

Likely larger than one 300-LOC PR (resolver + wiring 4-5 hierarchies + 2 downstream
fixes). Land resolver + `registerSubclass` wiring first behind the column-aware
gate; split each downstream fault into its own story if independent.

## Acceptance criteria

- [ ] `usingSingleTableInheritance` (`inheritance.ts:592`) and
      `discriminateClassForRecord` (`inheritance.ts:568`) gate on
      `classHasAttribute` (`inheritance.ts:219`) not `stiEnabled`, matching Rails
      `inheritance.rb:307-308`, resolving within the receiver's tracked subtree
      (raising `SubclassNotFound` only for a genuinely bad type on an explicitly
      modeled hierarchy). Mirror in `Base.instantiate` (`base.ts:2325`).
- [ ] Canonical STI bases (`Post`, `Comment`, `Topic`, `Category`, `ClothingItem`)
      track subclasses via `registerSubclass` like `Company`.
- [ ] `companies` enum-status and `comments` association-registry faults resolved,
      or each split into its own story if root cause is independent of dispatch.
- [ ] `use-fixtures.test.ts:743` conformance stays green; canonical rows hydrate as
      their STI subclass (assert e.g. a `Firm` companies row is `instanceof Firm`).
- [ ] `Company.find(id)` and `Company.new(type:)` agree on the resolved class.
- [ ] `api:compare`/`test:compare` deltas non-negative; named-Rails test
      counterparts kept verbatim.
