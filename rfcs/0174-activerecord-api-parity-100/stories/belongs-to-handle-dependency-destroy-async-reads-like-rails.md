---
title: "activerecord: belongs_to handle_dependency's destroy_async arm uses public_send and to_s"
status: draft
updated: 2026-10-03
rfc: "0174-activerecord-api-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 100
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`BelongsToAssociation#handle_dependency` (`vendor/rails/v8.0.2/activerecord/lib/active_record/associations/belongs_to_association.rb:7-37`) was converged branch for branch in trails#8449. Its `:destroy_async` arm still reads differently from Rails in `packages/activerecord/src/associations/belongs-to-association.ts`:

- Rails: `owner.public_send(col)` / `owner.public_send(reflection.foreign_key)` / `owner.public_send(reflection.foreign_type)`. trails: `(this.owner as any)[col]` property reads through an `any` cast.
- Rails: `association_class.to_s` over either arm of `reflection.polymorphic? ? owner.public_send(foreign_type) : reflection.klass`. trails puts `.name` inside the class arm and wraps the result in `String(…)`, because `rbObjAsString` of a model class returns the class source text rather than its name.
- Rails: `owner_model_name: owner.class.to_s`. trails: `this.owner.constructor.name`, which drops a `moduleName` namespace.

## Acceptance criteria

- [ ] `rbObjAsString` (or the `to_s` it dispatches) answers a class with `rbModToS`, as Ruby's `Module#to_s` does, with a ruby-compat test.
- [ ] `handleDependency` reads the three owner values the way Rails does and calls `to_s` once on `associationClass` and on `owner.class`.
- [ ] A namespaced owner enqueues its qualified name.
