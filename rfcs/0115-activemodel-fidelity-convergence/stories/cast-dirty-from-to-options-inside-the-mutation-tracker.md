---
title: "Type-cast dirty from:/to: options inside AttributeMutationTracker, not at three Base call sites"
status: ready
updated: 2026-08-27
rfc: "0115-activemodel-fidelity-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 240
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Found while moving `ActiveModel::Dirty` off `Model` (PR #7113).

Rails normalises a dirty predicate's `from:` / `to:` options inside the
mutation tracker, not at the call site:
`activemodel/lib/active_model/attribute_mutation_tracker.rb:41-51`

```ruby
def changed?(attr_name, from: OPTION_NOT_GIVEN, to: OPTION_NOT_GIVEN)
  attribute_changed?(attr_name) &&
    (OPTION_NOT_GIVEN == from || attribute(attr_name).original_value == type_cast(attr_name, from)) &&
    (OPTION_NOT_GIVEN == to || attribute(attr_name).value == type_cast(attr_name, to))
end
```

`type_cast` runs the attribute's own type over the option value, so an enum's
`EnumType` converts a label to its stored value with no help from the caller —
one site, covering every predicate that reaches the tracker.

trails instead hoists the cast to three call sites in
`packages/activerecord/src/base.ts`, through `_castEnumDirtyOpts`
(`base.ts:4400`-ish), a helper with no Ruby counterpart:

- `Base#attributeChanged` (`base.ts:1823`)
- `Base#isSavedChangeToAttribute` (`base.ts:1846`)
- `Base#isWillSaveChangeToAttribute` (`base.ts:1860`)

each of which re-resolves the alias (`ctor.attributeAliases?.[name] ?? name`)
and re-casts before delegating. The comment above the first one already
concedes the divergence: "Rails normalises these via
AttributeMutationTracker#type_cast (which calls type.cast on the attribute's
EnumType); we mirror it here".

Two costs beyond the extra surface. Any predicate that reaches the tracker
without going through one of those three overrides gets no cast at all. And
because `Base#attributeChanged` has to shadow the module body, PR #7113 had to
spell its `super` as `AMDirty.prototype.attributeChanged.call(this, ...)` —
Ruby's `instance_method(...).bind(self).call` — now that `ActiveModel::Dirty`
is included INTO `Base` (attribute_methods/dirty.rb:42) rather than inherited
from `Model`.

## Converged shape

Give `AttributeMutationTracker` its `type_cast` (attribute_mutation_tracker.rb:
:53-55 — `attributes[attr_name].type.cast(value)`) and let `changed?` call it,
as the Ruby does. `_castEnumDirtyOpts` and all three `Base` overrides then have
nothing left to do and are deleted, which also retires the bound-method `super`
in `Base#attributeChanged` and lets `Omit<AMDirty, "attributeChanged">` in
`interface Base` (base.ts:4224) collapse back to a plain `AMDirty`.

Watch the alias arm: the three overrides resolve `attributeAliases` before
casting. Rails resolves the alias earlier, in the generated method's dispatch
(attribute_methods.rb:396-398), so the tracker already receives the canonical
name — confirm that holds in trails before dropping the lookup rather than
moving it into the tracker.

## Acceptance criteria

- `from:` / `to:` are type-cast inside `AttributeMutationTracker`, at
  attribute_mutation_tracker.rb:41-55's shape.
- `_castEnumDirtyOpts` and the three `Base` predicate overrides are gone;
  `interface Base` extends `AMDirty` without the `Omit`.
- Enum dirty predicates keep working through paths that do NOT go through those
  overrides — add the covering case if none exists.
- activerecord suite green (`enum.test.ts` and `dirty.test.ts` especially);
  `pnpm parity:api:calls` / `:args` clean; `pnpm parity:api:extra:gate` marks
  narrow, never rise; parity deltas non-negative.
