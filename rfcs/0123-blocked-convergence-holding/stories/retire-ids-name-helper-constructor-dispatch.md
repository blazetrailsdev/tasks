---
title: "Retire idsName: constructor dispatch resolves the ids writer via the generated method"
status: blocked
updated: 2026-09-25
rfc: "0123-blocked-convergence-holding"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: 7
pr: null
claim: "2026-09-25T15:39:53Z"
assignee: "query-cache-registry-unpaired-in-parity-api"
blocked-by: 'Blocked on sync-collection-mass-assignment-refuses-rails-replace. Rails'' constructor reaches the ids writer via public_send("#{k}=") (active_model/attribute_assignment.rb), which runs ids_writer''s query in line (collection_association.rb:61-83). trails'' Model.new must refuse without I/O (CollectionIdsAssignmentError via syncIdsWrite, which needs the association NAME). The generated `#{singular}_ids=` closure (builder/collection_association.rb:69-75) is the only record of the key->association mapping, and calling it starts idsWriter''s async query before any refusal can fire. rbObjRespondTo can''t tell it apart from an attribute writer either (attribute_methods/write.rb generates name= too). So base.ts can''t find the owner without re-deriving singularize(name)+''Ids''. It converges once the constructor may await: dispatch every key through _assignAttribute, and idsName folds back into defineReaders/defineWriters.'
closed-reason: null
---

## Context

trails#7797 added `idsName(name)` in `packages/activerecord/src/associations/builder/collection-association.ts` with a `@noRailsEquivalent PERMANENT` receipt. It exists only because `base.ts` `_collectionIdsKeyOwner` / `_extractAssociationAttrs` sort constructor attribute keys ahead of time, to defer `xIds` keys past `super()`.

Rails builds the name inline in each generated method (`vendor/rails/activerecord/lib/active_record/associations/builder/collection_association.rb:60-76`), and the constructor dispatches each key with `public_send("#{k}=")` (`activemodel/lib/active_model/attribute_assignment.rb`), so nothing consumes the name outside the builder.

## Converged shape

The constructor path finds the ids writer through the generated `#{k}=` method (the `respond_to?` analogue, `rbObjRespondTo`) instead of re-deriving the name. `idsName` is inlined back into `defineReaders`/`defineWriters` and the receipt is deleted.

## Acceptance criteria

- [ ] `idsName` export and its receipt are removed; `base.ts` does not derive the `Ids` name.
- [ ] `collection-persisted-setter-throws.trails.test.ts` constructor-form cases still pass.
- [ ] `parity:api:extra:gate` stays green.
