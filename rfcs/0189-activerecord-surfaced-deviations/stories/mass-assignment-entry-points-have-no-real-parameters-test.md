---
title: "activerecord: no test runs a real ActionController::Parameters through the mass-assignment entry points"
status: ready
updated: 2026-10-18
rfc: "0189-activerecord-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: 80
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced on trails#8786, which widened every mass-assignment entry point to
`Record<string, unknown> | PermittedAttributes`
(`vendor/rails/v8.0.2/activemodel/lib/active_model/attribute_assignment.rb:28-37`).

The tests that landed use the `ProtectedParams` stub
(`packages/activerecord/src/support/stubs/strong-parameters.ts`). It declares
`[key: string]: unknown`, so it was assignable to `Record<string, unknown>` before the change, and
its `keys` is a method where `ActionController::Parameters#keys` in trails is a getter
(`packages/actionpack/src/action-controller/metal/strong-parameters.ts:301`). Nothing compiles or
runs a real `Parameters` through `Relation#new`, `Relation#create`, a collection `build`, or a
singular `build` (`SingularAssociation#build`, `HasOneAssociation#_createRecord`), so the type
change and the `keys` reader dispatch in `Association#initializeAttributes` are covered only by a
hand-written class in `forbidden-attributes-protection.trails.test.ts`.

## Acceptance criteria

- [ ] A type-level (DX) test passes a permitted `ActionController::Parameters` to `Relation#new`,
      `Relation#create`, `Base.create`, a collection `build` and a has-one `build` with no cast.
- [ ] A runtime test builds through a scoped collection association and a has-one with a permitted
      `Parameters` whose keys overlap `scope_for_create`, and asserts the passed value wins; an
      unpermitted one raises `ForbiddenAttributesError`.
