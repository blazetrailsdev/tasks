---
title: "attributeTypes casts away the nil type Rails' attribute_types hash can hold"
status: ready
updated: 2026-09-05
rfc: "0134-activemodel-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by PR #7507, which converged the four `attr.type!` assertions named in
`nullable-attribute-type-assertions-outside-attribute`. Three converged
outright; the fourth moved rather than vanished, and this story is that
remainder.

`AttributeSet#castTypes` now returns `Record<string, ValueType | null>`,
faithfully mirroring `transform_values(&:type)`
(`vendor/rails/activemodel/lib/active_model/attribute_set.rb:24`) — Ruby yields
a nil type straight through. `attribute_types` is that same hash with a default
proc attached
(`vendor/rails/activemodel/lib/active_model/attribute_registration.rb:37-39`):

```ruby
def attribute_types # :nodoc:
  @attribute_types ||= _default_attributes.cast_types.tap do |hash|
    hash.default = Type.default_value
  end
end
```

The default proc answers a **missing key**; a **stored nil** still reads back as
nil, and `type_for_attribute` (`attribute_registration.rb:42-50`) returns
whatever the hash holds. So Ruby's `type_for_attribute` can return nil.

trails declares it cannot. `attributeTypes`
(`packages/activemodel/src/attribute-registration.ts:167-185`) narrows the
widened hash with a bare cast at the Proxy boundary —
`new Proxy(cast as Record<string, ValueType>, { ... })` — so the union is
erased in one place and `typeForAttribute` keeps a non-null `ValueType` return.

The cast was deliberate and is documented in #7507: declaring the hash honestly
forces `typeForAttribute` to return `ValueType | null`, and that widening was
measured at roughly 25 ActiveRecord call sites needing fresh narrowing —
`insert-all.ts:488`, `relation.ts:1862`, `inheritance.ts:297`,
`normalization.ts:52`, `associations/collection-association.ts:113`,
`fixtures.ts:472`, `table-metadata.ts:26`, plus a tail of `.trails.test.ts`
readers. #7507's own acceptance criteria forbade pushing assertions to callers,
so the cast contained it. Containment is not convergence.

Note the reachability: only an attribute inside a `Psych::Coder` payload carries
a nil type today (`attribute_set/yaml_encoder.rb:15,27`), and those never reach
a class-level attribute set. This is latent, not a live bug — the same standing
this whole nullable pass had.

## Converged shape

Drop the cast; declare `attributeTypes(): Record<string, ValueType | null>` and
`typeForAttribute(): ValueType | null` on both the ActiveModel host
(`attribute-registration.ts`) and `Base.typeForAttribute`
(`packages/activerecord/src/base.ts:886`), matching
`attribute_registration.rb:37-50`.

Then narrow at each caller the way Ruby does — which is to say, mostly not at
all: a call site that immediately sends to the result (`.cast(...)`,
`.serialize(...)`, `.deserialize(...)`) is a Ruby method send that raises
`NoMethodError` on nil, so `!` is the honest spelling there, the same one
`Attribute` and `Type::Serialized` already carry. A call site that stores or
forwards the value should widen its own field instead. Do not add a
`?? defaultValue()` anywhere: substituting the default for a stored nil is
exactly the `fetch`-vs-`??` divergence CLAUDE.md calls out, and it is not what
`hash.default =` does.

## Acceptance criteria

- [ ] No `as Record<string, ValueType>` (or equivalent) in `attributeTypes`;
      the Proxy is built over the honest union.
- [ ] `attributeTypes` and `typeForAttribute` return types admit null on both
      the ActiveModel host and `Base`.
- [ ] Every caller narrowed at its own site — `!` where the next operation is a
      Ruby send, a widened field where the value is stored — with no
      `?? defaultValue()` substitution introduced.
- [ ] `pnpm typecheck` clean; `pnpm parity:api` deltas non-negative for
      activemodel and activerecord.
- [ ] All five adapter lanes green.
