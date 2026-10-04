---
title: 'activerecord: has_many dependent: "delete" is Rails'' :delete_all'
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

Surfaced converging `activerecord-converge-invented-control-flow-arms-associations-part-2` (RFC 0178).

Rails' `Builder::HasMany.valid_dependent_options`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/associations/builder/has_many.rb`) is
`[:destroy, :delete_all, :nullify, :restrict_with_error, :restrict_with_exception, :destroy_async]`.
`:delete` is a has_one / belongs_to value only.

trails' `packages/activerecord/src/associations/builder/has-many.ts#validDependentOptions` also
admits `"delete"`, and 18 `hasMany` declarations across `packages/activerecord/src` (test models
included) spell Rails' `dependent: :delete_all` as `dependent: "delete"`. As a result
`CollectionAssociation#deleteAll` (`associations/collection-association.ts`) carries
`this.options.dependent === "destroy" || this.options.dependent === "delete"` where Rails'
`delete_all` (`associations/collection_association.rb:148-162`) tests `:destroy` alone. Dropping the
`"delete"` arm reds `clearing an exclusively dependent association collection`,
`dependence for associations with hash condition` and
`delete polymorphic has many with delete all`.

## Acceptance criteria

- [ ] Every `hasMany(..., { dependent: "delete" })` is `dependent: "deleteAll"`, matching the Rails model.
- [ ] `HasMany.validDependentOptions` drops `"delete"`.
- [ ] `deleteAll`'s `|| this.options.dependent === "delete"` arm and any other has_many `"delete"` consumer are removed.
