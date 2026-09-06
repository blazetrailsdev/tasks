---
title: "polymorphic_inverse_of looks the inverse up by options[:inverse_of], not by inverse_name"
status: done
updated: 2026-09-06
rfc: "0113-branch-and-guard-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: 9
pr: 7569
claim: "2026-09-06T18:38:16Z"
assignee: "sqlite-driver-binds-unbound-parameters-as-null"
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/activerecord/lib/active_record/reflection.rb:677-685`:

```ruby
def polymorphic_inverse_of(associated_class)
  if has_inverse?
    if inverse_relationship = associated_class._reflect_on_association(options[:inverse_of])
      inverse_relationship
    else
      raise InverseOfAssociationNotFoundError.new(self, associated_class)
    end
  end
end
```

Rails looks the inverse up by **`options[:inverse_of]`** — the explicitly
declared name — not by `inverse_name`. trails
(`packages/activerecord/src/reflection.ts:985-998`) looks it up by
`this.inverseName()`, which falls through to `automatic_inverse_of`
(`reflection.rb:756-772`) when no `inverse_of` was declared, and adds an
`if (!name) return null;` early return Rails does not have.

The two differ wherever `has_inverse?` is true through an AUTOMATIC inverse and
`options[:inverse_of]` is nil: Rails passes nil to `_reflect_on_association`,
gets nil, and raises `InverseOfAssociationNotFoundError`; trails resolves the
automatic inverse and returns it. trails' extra guard also swallows the raise
in the nil case, so the error arm is unreachable where Rails reaches it.

Surfaced by #7435 while auditing `inverse_name`'s readers for the
`inverse_of: false` return-value change.

## Converged shape

```ts
polymorphicInverseOf(associatedClass: typeof Base): AssociationReflection | ThroughReflection | null {
  if (this.hasInverse()) {
    const inverseRelationship = associatedClass._reflectOnAssociation(
      this.options.inverseOf as string,
    );
    if (inverseRelationship) return inverseRelationship;
    throw new InverseOfAssociationNotFoundError(this._concrete(), associatedClass);
  }
  return null;
}
```

## Acceptance criteria

- The lookup key is `options[:inverse_of]`, not `inverseName()`.
- The invented `if (!name) return null;` guard is gone, so the
  `InverseOfAssociationNotFoundError` arm is reachable exactly where
  `reflection.rb:681-683` reaches it.
- The polymorphic-association and inverse-association suites pass on all
  adapter lanes; `pnpm parity:api:calls` / `:calls:args` clean.
