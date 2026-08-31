---
title: "Retire the parked-promise pattern: delete parkNestedReaderLoad and its four call sites"
status: done
updated: 2026-08-31
rfc: "0087-awaitable-association-writers-only"
cluster: "rails-deviation"
packages:
  - "activerecord"
deps: []
deps-rfc: []
est-loc: 400
priority: 2
pr: 7303
claim: "2026-08-31T16:13:25Z"
assignee: "retire-the-parked-promise-pattern"
blocked-by: null
closed-reason: null
---

## Context

`parkNestedReaderLoad` (`packages/activerecord/src/nested-attributes.ts:435`)
stashes a promise on the record — `_pendingNestedReaderLoads` — and a `save`
monkey-patch drains it later. It is tagged `@noRailsEquivalent PERMANENT`. It is
not permanent: **the pattern is retired outright, not documented better.**

Four call sites park:

| site                                                                   | Rails                                    |
| ---------------------------------------------------------------------- | ---------------------------------------- |
| `base.ts:561` `_applyScopeAttributes`                                  | `scoping.rb:60-66` from `core.rb:474`    |
| `scoping.ts:102` `populateWithCurrentScopeAttributes`                  | same                                     |
| `base.ts:3198` the `attributes=` accessor                              | `activemodel/attribute_assignment.rb:36` |
| `associations/association.ts:460` `buildRecord`'s `initializeAndYield` | `associations/association.rb:383-388`    |

All four exist because `assignAttributes` answers `Promise<void> | void`, and a
Ruby-synchronous caller cannot await it.

### Why the promise is there at all

`assignNestedAttributesForOneToOneAssociation`
(`nested-attributes.ts:514-521`) reads `assoc.reader`, and when the association
is not loaded that reader is a Promise, so the whole assignment turns async.
Ruby's counterpart is `send(association_name)` — a **synchronous** DB read
inside a synchronous assignment path. That is the entire gap: one async read,
propagated outward until something invents a place to put the promise.

### It is worse than one deviation

- **Two parallel deferral mechanisms** live in the same file:
  `_pendingNestedReaderLoads` (promises, drained by `awaitPendingNestedReaderLoads`)
  and `_pendingNestedAttributes` (attribute hashes, drained by
  `processNestedAttributes`). Rails has neither.
- **Both hang off a `save` monkey-patch.**
  `acceptsNestedAttributesFor` reassigns `modelClass.prototype.save` behind a
  `_nestedSaveWrapped` flag (`nested-attributes.ts:60-75`). Rails does none of
  this — nested attributes ride the ordinary autosave callbacks.
- **The drain is conditional on an unrelated macro.** A model that never calls
  `acceptsNestedAttributesFor` gets no wrapper, so its parked promise is never
  awaited and its rejection is swallowed — the defect
  `parked-assignment-has-no-drain-without-accepts-nested-attributes` describes.
- **A parked rejection is converted to a value** (`:436-439`) and rethrown later
  from `save`, so the stack points at the drain, not the assignment.

### The constructor arm is not a language limit

The prior framing held that the `scoping.rb:60-66` arm is a genuine TypeScript
shortcoming, because a JS constructor cannot await. That premise is worth
re-testing before any park survives on it: `Model.where(assoc: x).new` builds an
**unpersisted** owner, and Rails does no I/O there either — `find_target?` is
false for a new record so `load_target` never queries, and `replace`'s
`save &&= owner.persisted?` (`has_one_association.rb:66`) makes the save a
no-op. If trails' writer owes I/O on that path, the I/O is the deviation and the
park is a symptom of it. Removing the I/O removes the need to await.

## Converged shape

1. Make the reads awaited **where the caller can already await** — the
   `setAttributes` / association-writer surface this RFC has been building
   toward. `assignAttributes` stops returning a union.
2. Delete `parkNestedReaderLoad`, `_pendingNestedReaderLoads`,
   `awaitPendingNestedReaderLoads`, and all four call sites.
3. Fix the constructor arm by removing the I/O rather than deferring it (see
   above). Where an assignment genuinely cannot be completed synchronously and
   the caller cannot await, it **raises** — the `attributes=` accessor already
   has the awaitable spelling `setAttributes` to point at — rather than parking.
4. Delete the `save` monkey-patch's `awaitPendingNestedReaderLoads` step. Whether
   `processNestedAttributes` and `_pendingNestedAttributes` can go the same way
   is the follow-on; file it rather than widening this story.

Ordering note: `parked-assignment-has-no-drain-without-accepts-nested-attributes`
(this RFC, draft) proposes moving the drain to `save`/`save!` so every model
reaches it. That is a mitigation of the pattern this story deletes. Land this
one and close that as superseded, or land that one first only if the deletion
needs a stepping stone — do not do both.

## Acceptance criteria

- [ ] `git grep parkNestedReaderLoad` and `git grep _pendingNestedReaderLoads`
      return nothing under `packages/`.
- [ ] `assignAttributes` has a single return type, not `Promise<void> | void`.
- [ ] No call site defers an assignment by stashing a promise on the record.
- [ ] A model with **no** `acceptsNestedAttributesFor` and an
      association-valued scope attribute (`Model.where(assoc: x).new`) completes
      its write, and a failing one surfaces its rejection at the assignment, not
      out of a later `save` — both pinned by tests that fail on the baseline.
- [ ] `pnpm parity:api:extra` loses the `parkNestedReaderLoad`
      `@noRailsEquivalent` receipt rather than rewording it.
- [ ] AR suite green on all three lanes.
