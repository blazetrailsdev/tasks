---
title: "read-association-scope-off-reflection-not-definition-bag"
status: done
updated: 2026-08-14
rfc: "0099-call-argument-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6512
claim: "2026-08-14T12:07:07Z"
assignee: "read-association-scope-off-reflection-not-definition-bag"
blocked-by: null
closed-reason: null
---

# Read the association scope off the reflection, not the options hash

## Context

PR #6512 dropped `:scope` from `Builder::Association::VALID_OPTIONS` and deleted
the `createReflection` lift, so a scope now reaches `Reflection.create` only as
the second positional, exactly as `associations/builder/association.rb:20-22,43`
has it.

What was left was the options hash: `createReflection` wrote the positional
scope back onto the `_associations` entry's `options`
(`associations/builder/association.ts`), the HABTM builder did the same, and
the loaders read `options.scope` — `collection-proxy.ts`, `relation.ts`,
`singular-association.ts`, `has-many-association.ts`,
`has-many-through-association.ts`, `association.ts`, `counter-cache.ts`.
Rails' options hash never carries the scope; `assert_valid_keys` would reject
it (`association.rb:21,70`).

## Converged shape (landed in #6512)

The scope lives on the reflection object beside the options hash, which is
where Rails keeps it: `MacroReflection#initialize(name, scope, options,
active_record)` assigns `@scope` and `@options` separately (`reflection.rb:388-392`)
and exposes both as readers (`reflection.rb:376,382`). trails'
`AssociationDefinition` IS that object — it is what `Association#reflection`
holds (`association.rb:32`, `associations/association.ts:33`) and its fields are
already documented against `MacroReflection#macro`,
`AssociationReflection#foreign_key`, `AbstractReflection#klass` — so it gained a
`scope` field mirroring `attr_reader :scope`, and `options` was cleared of it.

`scope` is off `AssociationOptions` entirely, so the compiler now rejects the
bag spelling everywhere.

## Acceptance criteria

- [x] Neither `createReflection` nor the HABTM builder puts the scope in an
      options hash.
- [x] No loader reads `options.scope`; each reads the reflection's `scope`.
- [x] `scope` is off `AssociationOptions`.
- [x] `pnpm parity:api:calls` / `:args` green; association suites green.
