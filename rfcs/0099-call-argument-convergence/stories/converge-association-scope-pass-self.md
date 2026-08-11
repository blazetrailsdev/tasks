---
title: "Pass the association itself to AssociationScope.scope, not a reflection literal"
status: done
updated: 2026-08-11
rfc: "0099-call-argument-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 140
priority: null
pr: 6367
claim: "2026-08-11T16:03:42Z"
assignee: "burndown-order-only-rows-associations-remainder"
blocked-by: null
closed-reason: null
---

## Context

Left unconverged by `call-args-ar-kwargs-vs-positional` (PR #6360), which
converged 22 of its 29 rows. This one needs a construction change, not a
call-site edit.

Rails `Association#association_scope`
(`activerecord/lib/active_record/associations/association.rb:300-308`):

```ruby
def association_scope
  if klass
    @association_scope ||= if disable_joins
      DisableJoinsAssociationScope.scope(self)
    else
      AssociationScope.scope(self)
    end
  end
end
```

Rails passes `self`. trails (`packages/activerecord/src/associations/association.ts`,
`associationScope()`) builds a literal instead:

```ts
const richReflection = ctor._reflectOnAssociation?.(this.reflection.name) ?? this.reflection;
this._cachedScope = AssociationScope.scope({
  owner: this.owner,
  reflection: richReflection,
  klass,
});
```

The literal exists only to substitute a _rich_ reflection — looked up off the
owner's class via `_reflectOnAssociation` — for `this.reflection`. In Rails
`association.reflection` already IS that reflection, because the association is
constructed from the class's reflection. So the divergence is upstream: trails
builds some associations with a thinner reflection than the one the class
carries.

`AssociationScope.scope` already accepts an `AssociationScopeable`
(`{ owner, reflection, klass }`), which `Association` structurally satisfies —
the only blocker is the reflection substitution.

## Converged shape

Make `Association#reflection` return the reflection the owner's class holds, so
`associationScope()` reads:

```ts
this._cachedScope = this.disableJoins
  ? DisableJoinsAssociationScope.scope(this)
  : AssociationScope.scope(this);
```

and drop the `richReflection` local. Same for the `disableJoins` arm, which
currently passes the same literal to `getDjasScopeBuilder()`.

## Acceptance criteria

1. `association_scope` passes `this` on both arms, cited to
   `associations/association.rb:300-308`.
2. No `richReflection` local anywhere; `this.reflection` is the rich reflection.
3. The `associations/association.ts` `association_scope` → `scope` row is
   deleted from `scripts/api-compare/call-mismatches-exclude/` (only-shrink, by
   hand — never `--write`).
4. `pnpm parity:api:calls` and `pnpm parity:api:calls:args` stay green.
