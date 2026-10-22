---
title: "base-constructor-assigns-associations-through-writer"
status: claimed
updated: 2026-10-22
rfc: "0198-activerecord-mixin-host-typing"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 2
pr: null
claim: "2026-10-22T16:52:16Z"
assignee: "base-constructor-assigns-associations-through-writer"
blocked-by: null
closed-reason: null
---

## Context

After the has_many :through has_one inverse arm moved to `rbFSend(record, "${inverse.name}=", …)`
(matching `vendor/rails/v8.0.2/activerecord/lib/active_record/associations/has_many_through_association.rb:106-107`),
the only remaining caller of `HasOneAssociation#syncWrite` (`packages/activerecord/src/associations/has-one-association.ts`,
no Rails counterpart) and `CollectionAssociation#syncWrite` is `_dispatchAssociationAttrs` in
`packages/activerecord/src/base.ts` (the constructor's association assignment). Rails' constructor reaches
association writers through `assign_attributes` → `_assign_attribute` → `public_send("#{k}=", v)`
(`vendor/rails/v8.0.2/activemodel/lib/active_model/attribute_assignment.rb`), i.e. `association(name).writer(value)`.
`syncWrite` exists because `replace` can return a promise; on a new owner the writer does not save.

## Acceptance criteria

- [ ] The constructor assigns has_one / collection associations through the generated writer (or `association(name).writer`), not `syncWrite`.
- [ ] `HasOneAssociation#syncWrite` (and the collection twin if unused) is deleted along with its `@noRailsEquivalent` receipt.
- [ ] Constructor association-assignment tests (`base.test.ts`, `has_one_associations_test.rb` / `has_many_associations_test.rb` "new with association attributes" arms) stay green.
