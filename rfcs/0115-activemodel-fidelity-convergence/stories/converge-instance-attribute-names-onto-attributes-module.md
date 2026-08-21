---
title: "Converge Model's instance attributeNames() onto ActiveModel::Attributes#attribute_names"
status: in-progress
updated: 2026-08-21
rfc: "0115-activemodel-fidelity-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: 6799
claim: "2026-08-21T00:17:06Z"
assignee: "converge-date-type-cast-for-schema-to-rails"
blocked-by: null
closed-reason: null
---

## Context

Rails' instance `ActiveModel::Attributes#attribute_names`
(`vendor/rails/activemodel/lib/active_model/attributes.rb:146-148`) is:

```ruby
def attribute_names
  @attributes.keys
end
```

`Attributes.prototype.attributeNames()` in
`packages/activemodel/src/attributes.ts` already has exactly that body, but it
is shadowed: `Model` defines its own instance `attributeNames()` in the class
body (`packages/activemodel/src/model.ts`, just above the `attributes`
`declare`), which delegates to the CLASS-level reader and filters out
`virtual` attributes:

```ts
attributeNames(): string[] {
  return [...(this.constructor as typeof Model).attributeNames()];
}
```

Two divergences fall out of that: it reads the class's declared attributes
rather than the instance's `@attributes` keys, and it drops virtual
attributes, which Rails' `@attributes.keys` includes.

Surfaced in review of #6796 (which moved `Model#attributes` onto the included
`Attributes` module). Left out of that PR because deleting the class-body
method changes behaviour for every `attributeNames()` caller, in ActiveRecord
as well as ActiveModel.

## Converged shape

Delete `Model`'s class-body instance `attributeNames()` so `include(Model,
Attributes)` installs `Attributes.prototype.attributeNames`
(`attributes.rb:146-148`) — the same move #6796 made for `attributes`
(`attributes.rb:131-133`), including the `declare` for the type if needed.
Where a caller genuinely wanted the class-level, virtual-filtered list, it
should call `Model.attributeNames()` explicitly.

## Acceptance criteria

- Instance `attributeNames()` returns `this._attributes.keys()`, virtual
  attributes included, and comes from the included module rather than
  `Model`'s class body.
- Callers that relied on the class-level filtered list are moved to the
  class-level reader.
- `pnpm parity:api` / `pnpm parity:test` deltas non-negative;
  `pnpm parity:api:calls` / `:args` clean.
