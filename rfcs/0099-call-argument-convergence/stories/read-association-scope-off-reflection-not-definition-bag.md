---
title: "read-association-scope-off-reflection-not-definition-bag"
status: ready
updated: 2026-08-14
rfc: "0099-call-argument-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

# Read the association scope off the reflection, not the `_associations` bag

## Context

PR #6512 dropped `:scope` from `Builder::Association::VALID_OPTIONS` and deleted
the `createReflection` lift, so a scope now reaches `Reflection.create` only as
the second positional, exactly as `associations/builder/association.rb:20-22,43`
has it.

What it did NOT converge is trails' `AssociationDefinition` bag. `createReflection`
still writes the positional scope back onto the `_associations` entry
(`packages/activerecord/src/associations/builder/association.ts:142-143`:
`if (scope) assocOptions.scope = scope;`), and the HABTM builder does the same
(`associations/builder/has-and-belongs-to-many.ts:336-339`), because the loaders
downstream read it from there rather than from the reflection:

- `associations/has-many-association.ts:779,821`
- `associations/has-many-through-association.ts:1198,1231,1239,1246,1262`
- `associations/singular-association.ts:391`
- `associations/collection-proxy.ts:2954,2995`

Rails keeps the scope on the reflection — `Reflection.create(macro, name, scope,
options, model)` (`association.rb:49`), `HasAndBelongsToManyReflection.new(name,
scope, options, ...)` (`associations.rb:1871`) — and every read is
`reflection.scope` (`association_scope.rb:169-172`). The options hash never
carries it.

`_associations` / `AssociationDefinition` is itself a trails invention with no
Rails counterpart, so this is one step of retiring it.

## Acceptance criteria

- [ ] `createReflection` no longer copies the positional scope onto the
      `_associations` entry, and neither does the HABTM builder.
- [ ] Every `options.scope` read listed above resolves the scope from the
      reflection instead.
- [ ] `scope` is off `AssociationOptions`.
- [ ] `pnpm parity:api:calls` / `:args` green; association suites green.
