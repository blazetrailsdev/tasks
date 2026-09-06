---
title: "AttributeSet#write_from_database invents a type parameter and a default-type fallback"
status: ready
updated: 2026-09-06
rfc: "0113-branch-and-guard-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 110
priority: 16
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced while dropping the invented `:value` type registration in PR #7427
(`type-registries-register-nonexistent-value-type-name`). One of the three
fallbacks that looked up the invented name lives in
`AttributeSet#write_from_database`, and Rails' method has neither the parameter
it guards nor the fallback.

Rails (`vendor/rails/activemodel/lib/active_model/attribute_set.rb:54-56`):

```ruby
def write_from_database(name, value)
  @attributes[name] = self[name].with_value_from_database(value)
end
```

Two arguments, no type. The type comes from `self[name]`
(`attribute_set.rb:15-17`), which answers the stored attribute or
`default_attribute(name)` — the seat that decides what an unknown name's type
is.

trails (`packages/activemodel/src/attribute-set.ts`) adds an optional third
parameter and a fallback:

```ts
writeFromDatabase(name, value, type?: { deserialize(value: unknown): unknown }): void {
  ...
  const colType = (type as Type) ?? defaultValue();
  this._attributes[name] = Attribute.fromDatabase(name, value, colType);
}
```

So an unknown name does not go through the `self[name]` /
`default_attribute` seat at all: it builds an attribute from a caller-supplied
type, or a bare `Type::Value` when the caller supplies none. That is a third
way to answer "what type does this attribute have", parallel to the one Rails
has, and it is why the invented `:value` registry name had a caller here.

## Converged shape

`writeFromDatabase(name, value)` — two parameters, mirroring
`attribute_set.rb:54-56` — with the missing-key path going through the port of
`self[name]` / `default_attribute`, not through a caller-passed type or a
`defaultValue()` default. Convert the call sites that pass a third argument.

## Acceptance criteria

- [ ] `writeFromDatabase` takes `(name, value)` only.
- [ ] An unknown name resolves its type through the `self[name]` /
      `default_attribute` seat, as `attribute_set.rb:55` does.
- [ ] The `?? defaultValue()` fallback is gone.
- [ ] Call sites passing a third argument are converted, not shimmed.
- [ ] `parity:api:params` / `:calls:args` deltas non-negative.
