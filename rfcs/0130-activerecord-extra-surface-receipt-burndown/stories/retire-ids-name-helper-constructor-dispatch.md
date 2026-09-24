---
title: "Retire idsName: constructor dispatch resolves the ids writer via the generated method"
status: blocked
updated: 2026-09-24
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: 8
pr: null
claim: "2026-09-24T13:35:28Z"
assignee: "point-value-converges-onto-active-record-point"
blocked-by: "Depends on define-association-accessors-into-generated-association-methods: Builder::Association.define_accessors installs readers/writers on model.prototype, not model.generated_association_methods (builder/association.rb:95-100), so the #{k}= ids writer cannot be told apart from attribute writers without re-deriving the name"
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
