---
title: "CollectionAssociation defines delete_or_nullify_all_records bodies Rails leaves to its subclasses"
status: draft
updated: 2026-10-04
rfc: "0178-activerecord-arms-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`CollectionAssociation` (`packages/activerecord/src/associations/collection-association.ts`) defines `deleteOrNullifyAllRecords`, `nullifyAllRecords`, `deleteAllRecords` and `computeNullifiedOwnerAttributes`. Rails' `CollectionAssociation` has none of them: `delete_all` (`vendor/rails/v8.0.2/activerecord/lib/active_record/associations/collection_association.rb:148-166`) calls `delete_or_nullify_all_records`, which only the subclasses define — `HasManyAssociation` (`has_many_association.rb:112-125`, `count = delete_count(method, scope); update_counter(-count); count`) and `HasManyThroughAssociation` (`has_many_through_association.rb`, `delete_records(load_target, method)`).

The base-class bodies carry `typeof rel.updateAll === "function"` / `typeof record.save === "function"` guards and a load-and-save-each fallback Rails has no counterpart for. `HasManyAssociation`'s `deleteCount` (`has-many-association.ts`) reaches `computeNullifiedOwnerAttributes` through a cast and falls back to `Promise.resolve(0)` when `scope.deleteAll` / `scope.updateAll` is missing; Rails' `delete_count` (`has_many_association.rb:112-118`) is `if method == :delete_all then scope.delete_all else scope.update_all(nullified_owner_attributes) end`.

Found while converging #8478; these bodies were outside that story's row list. Related: `nullified-owner-attributes-fk-ladder-single-site`.

## Acceptance criteria

- [ ] `CollectionAssociation` no longer defines `deleteOrNullifyAllRecords`, `nullifyAllRecords`, `deleteAllRecords` or `computeNullifiedOwnerAttributes`; `deleteAll` calls the subclass method as Rails' does.
- [ ] `deleteCount` is Rails' two-arm body calling `nullified_owner_attributes` from `ForeignAssociation`, with no `?.` fallbacks.
- [ ] `pnpm parity:api:calls`, `parity:api:extra:gate` and the arms report stay clean for the touched methods.
