---
rfc: "0022-singular-association-holder"
title: "Singular-association holder & _cachedAssociations deletion"
status: closed
created: 2026-06-10
updated: 2026-06-24
owner: "@deanmarano"
packages: [activerecord, activemodel]
clusters:
  - associations
---

# RFC 0022 — Singular-association holder & `_cachedAssociations` deletion

## Summary

Finish what RFC 0006 (collection-store unification) started. RFC 0006 moved
has_many target data onto the `CollectionProxy` (`@target` analog) and stopped
at **Option A** — keep the generic `_cachedAssociations` value-map for the
singular (has_one / belongs_to) associations. This RFC pursues **Option B**:
store singular targets on a `SingularAssociation`-style holder reached through
`record.association(name)`, route every remaining reader/writer through it, and
**delete `_cachedAssociations` entirely**, converging trails onto Rails' single
`@association_cache` model.

## Motivation

Rails keeps **one** association cache. `@association_cache` (`associations.rb:81`)
maps association name → the **Association object** (`HasManyAssociation`,
`BelongsToAssociation`, …); the loaded rows live inside that object as
`@target`. Preloading, inverse-wiring, and reads all go through it:

```ruby
def association(name)                 # associations.rb:51
  association = association_instance_get(name)        # @association_cache[name]
  ...
end

def association_instance_set(name, a) # associations.rb:86
  @association_cache[name] = a
end
```

Serialization never pokes the cache — it calls the reader:

```ruby
def serializable_add_includes(options = {})           # activemodel
  includes.each do |association, opts|
    if records = send(association)    # literally calls post.comments
      yield association, records, opts
    end
  end
end
```

trails fragmented that one store into **four** parallel maps on every record:
`_cachedAssociations` (raw name→target _value_), `_preloadedAssociations`,
`_collectionProxies`, and `_associationInstances`. `_cachedAssociations` is the
one with **no Rails counterpart** — Rails has no name→value map, only
name→Association-object. It exists only because several trails read paths want a
synchronous target value without going through the (async) association reader.

RFC 0006 removed has_many's dependence on it. What remains (verified
2026-06-10):

**Singular writers** still populating `_cachedAssociations`:

- `associations.ts:2371` — `setBelongsTo`
- `associations.ts:2422` — `setHasOne`
- `associations.ts:311`, `association-relation.ts:205`,
  `nested-attributes.ts:264`, `relation.ts:2536` — inverse-of seeding (belongs_to
  side)
- `associations.ts:2040` — `createThroughAssociation` (single target)

**Singular readers**:

- `associations.ts:817` — `loadBelongsTo`
- `associations.ts:968` — `loadHasOne`
- `associations.ts:2240` — `update_counters` (belongs_to owner fast-path)
- `validations/association-helpers.ts:10`, `validations.ts:187`
- `autosave-association.ts:86` — `_loadedAssociation`
- `persistence.ts:1098–1374` — reload clears/copies the map

**The serialization overload**: `activemodel/src/serialization.ts:236` reads
`record._cachedAssociations?.get(name)` for _any_ `include` key — a generic
"include bag", not association storage. Some `json-serialization.test.ts` cases
seed `_cachedAssociations["comments"]` on models that declare **no**
`has_many comments` at all; Rails could not run those (`send(:comments)` would
`NoMethodError`). This overload is what blocks a clean "singular-only" narrowing
and must be resolved by moving serialization onto the reader, as Rails does.

**Cost of the split**: 13 test files (~150 direct pokes) couple to the map's
shape. Every singular write path has to remember to populate it; every reader
re-derives the "is it an array or a scalar" branch. It is the same
two-stores-kept-in-sync-by-hand problem RFC 0006 named, on the singular side.

## Design

Converge onto Rails' single cache, incrementally, behind `record.association(name)`.

### 1. Singular holder

Give has_one / belongs_to a `SingularAssociation`-style holder object (the
trails analog of Rails `SingularAssociation` with `@target` + `@loaded`),
reachable and memoized through `record.association(name)` exactly like the
`CollectionProxy` is for has_many. The holder owns:

- `target: Base | null` — the loaded record (or loaded-nil).
- `loaded: boolean` — distinguishes "loaded nil" from "not loaded".
- `setInverseInstance` / stale-target checks — already modelled on the
  `CollectionProxy` side; mirror them here.

`setBelongsTo` / `setHasOne` and the inverse-of seeders write the holder's
`target` instead of `_cachedAssociations.set(...)`. `loadBelongsTo` /
`loadHasOne` read `association(name).target` (with the existing
`_preloadedAssociations` fallback) instead of `_cachedAssociations.get(...)`.

### 2. Serialization through the reader

Replace the `_cachedAssociations` poke in `activemodel/src/serialization.ts`
with a synchronous loaded-target accessor that mirrors Rails' `send(association)`
— it returns the holder/proxy target when the association is loaded and skips
the include otherwise (Rails' `if records = send(association)`). The host
interface gains a single `_loadedAssociationTarget(name)` method
(activerecord supplies it; activemodel only depends on the interface). The
`json-serialization.test.ts` cases that abused the generic include-bag are
re-pointed at declared associations + the holder, removing the non-faithful
seeding.

### 3. Migrate remaining singular readers

Route `update_counters`, the validation association-helpers, autosave's
`_loadedAssociation`, and `persistence` reload through `association(name)` /
the holder. None of these are has_many-specific after RFC 0006.

### 4. Delete `_cachedAssociations`

With no production reader or writer left, delete the field from `base.ts` and
the host interfaces in `persistence.ts` / `validations.ts` / `autosave` /
`activemodel`. The ~150 test pokes are migrated onto `record.association(name)`
or a thin `record._associationCache(name)` accessor whose shape mirrors Rails'
`@association_cache[name]` (returns the Association object) — **no test
renames**. `_preloadedAssociations` is left as the one remaining preload seam
(or folded into the holder in an optional capstone).

## Alternatives considered

- **Stop at Option A (RFC 0006 S4).** Keep `_cachedAssociations` for singular +
  the serialization include-bag. Rejected as the long-term state: it preserves
  the no-Rails-counterpart map and the non-faithful serialization tests. Option A
  is the already-shipped intermediate; this RFC is the convergence.
- **Fake `has_many` declarations into serialization tests** to force the
  include-bag through a proxy. Rejected: moves the test models _further_ from
  Rails. Story B2 instead moves serialization onto the reader, which is what
  Rails actually does.

## Rollout

1. Phase 1 — singular holder + writer/reader migration: **b1**
2. Phase 2 — serialization through the reader: **b2**
3. Phase 3 — remaining singular readers (counter-cache, validations, autosave,
   persistence): **b3**
4. Phase 4 — delete `_cachedAssociations` + migrate test pokes: **b4**
5. Phase 5 (optional) — fold `_preloadedAssociations` into the holder /
   converge `_associationInstances` + `_collectionProxies` into one
   `@association_cache`-style map: **b5**

Each story branches from `main`, is independently shippable, and keeps
`api:compare` non-negative. No stacked PRs.

## Open questions

1. **Holder reuse.** Does the existing `_associationInstances` map already give
   us a memoization slot for the singular holder, or do we add a sibling to
   `_collectionProxies`? Recommendation: reuse `_associationInstances` so the
   final state is one map (Rails parity).
2. **`_preloadedAssociations` fate.** Fold into the holder (full Rails parity)
   or leave as an explicit preload seam? Recommendation: leave for b5; it is
   orthogonal to deleting `_cachedAssociations`.
3. **`_associationCache(name)` shim shape.** Return the Association object (Rails
   `@association_cache[name]`) or the target value? Recommendation: the object,
   so the name does not mislead anyone cross-referencing Rails — tests read
   `.target` off it.

## Stories

<!-- generated: stories table -->

| ID                                                                                                                          | Title                                                                                                               | Status | Est LOC | Cluster      |
| --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ------ | ------- | ------------ |
| [b1-singular-association-holder](stories/b1-singular-association-holder.md)                                                 | Singular-association holder + writer/reader migration                                                               | done   | 250     | associations |
| [b2-serialization-via-reader](stories/b2-serialization-via-reader.md)                                                       | Serialization include through the reader                                                                            | done   | 200     | associations |
| [b3-migrate-singular-readers](stories/b3-migrate-singular-readers.md)                                                       | Migrate counter-cache / validation / autosave / persistence readers                                                 | done   | 200     | associations |
| [b4-delete-cached-associations](stories/b4-delete-cached-associations.md)                                                   | Delete \_cachedAssociations + migrate test pokes                                                                    | done   | 250     | associations |
| [b5-converge-association-cache](stories/b5-converge-association-cache.md)                                                   | (optional) Converge onto one @association_cache map                                                                 | done   | 200     | associations |
| [converge-has-one-through-preloaded-reader-arity](stories/converge-has-one-through-preloaded-reader-arity.md)               | converge-has-one-through-preloaded-reader-arity                                                                     | done   | 60      | —            |
| [fold-three-association-maps-into-one](stories/fold-three-association-maps-into-one.md)                                     | Fold \_associationInstances/\_collectionProxies/\_preloadedAssociations into one @association_cache slot            | done   | 250     | —            |
| [migrate-preloaded-associations-shadow-readers-to-proxy](stories/migrate-preloaded-associations-shadow-readers-to-proxy.md) | Migrate \_preloadedAssociations shadow readers in associations.ts to read from the real CollectionProxy/Association | done   | 150     | —            |
| [reload-association-owner-repoint-on-cache-convergence](stories/reload-association-owner-repoint-on-cache-convergence.md)   | reload must re-point association owner to self after adopting fresh's @association_cache                            | done   | 60      | —            |
| [remove-preloaded-associations-shadow-map](stories/remove-preloaded-associations-shadow-map.md)                             | remove-preloaded-associations-shadow-map                                                                            | done   | null    | —            |
| [set-has-many-replace-semantics](stories/set-has-many-replace-semantics.md)                                                 | setHasMany should mirror Rails CollectionAssociation#replace (FK-diff true replace)                                 | done   | 120     | —            |
| [singular-reader-return-type-lie](stories/singular-reader-return-type-lie.md)                                               | singular reader return type lies — Promise cast silences TS                                                         | done   | 40      | —            |
| [singular-reader-stale-target-check](stories/singular-reader-stale-target-check.md)                                         | singular-reader-stale-target-check                                                                                  | done   | null    | —            |

## Changelog

- 2026-06-10: initial RFC — supersedes RFC 0006 Option A; pursues Option B.
