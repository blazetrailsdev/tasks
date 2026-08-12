---
title: "converge-association-resolve-foreign-key-helpers"
status: done
updated: 2026-08-12
rfc: "0084-wide-call-set-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: 6409
claim: "2026-08-12T12:26:11Z"
assignee: "call-args-ar-extra-argument-rest-2"
blocked-by: null
closed-reason: null
---

## Context

Surfaced converging `Association#matches_foreign_key?` in PR #6394 (RFC 0084).

`Association#resolveForeignKey` and `Association#resolveReflectionType`
(`packages/activerecord/src/associations/association.ts:825-851`) are trails
inventions with no Rails counterpart. Rails reads `reflection.foreign_key` and
`reflection.type` directly — e.g. `initialize_attributes`
(`vendor/rails/activerecord/lib/active_record/associations/association.rb:217-225`):

```ruby
skip_assign = [reflection.foreign_key, reflection.type].compact
```

against trails'

```ts
const skipAssign = [...this.resolveForeignKey(), this.resolveReflectionType()].filter(...)
```

The helpers exist because `Association#reflection` is _typed_ as the lightweight
`AssociationDefinition` (`associations.ts:177`, `foreignKey?: string | string[]`),
so they re-resolve the rich reflection through
`ctor._reflectOnAssociation?.(this.reflection.name)`. PR #6394 established by
measurement that this is unnecessary on the normal construction path: the object
`association(name)` builds the holder with IS the rich reflection
(`HasManyReflection`), and `this.reflection.foreignKey` already returns the
derived `"post_id"` for an association with no explicit `foreignKey:` option.
`matchesForeignKey` and `isForeignKeyFor` both read it directly today.

With the last two callers of `resolveForeignKey` gone from
`matches_foreign_key?`, `initialize_attributes` is the only site left holding
both helpers up.

## Acceptance criteria

- [ ] `initializeAttributes` reads `this.reflection.foreignKey` and
      `this.reflection.type` directly, as `association.rb:219` does.
- [ ] `resolveForeignKey` and `resolveReflectionType` are deleted (they are
      `private`, so this is `parity:api:extra`-neutral but removes two invented
      indirections from a ported file).
- [ ] If a construction path genuinely supplies a bare `AssociationDefinition`
      without a derived `foreignKey`, fix the reflection it is built from rather
      than reinstating the re-resolve — and cite the path in the PR.
- [ ] Association, autosave, nested-attributes, polymorphic and STI suites green
      on all three adapter lanes.
