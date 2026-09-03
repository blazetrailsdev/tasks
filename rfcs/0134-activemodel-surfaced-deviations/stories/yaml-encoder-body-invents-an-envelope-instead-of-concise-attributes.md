---
title: "yaml-encoder-body-invents-an-envelope-instead-of-concise-attributes"
status: draft
updated: 2026-09-03
rfc: "0134-activemodel-surfaced-deviations"
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

## Context

`YAMLEncoder#encode`/`#decode`
(`packages/activemodel/src/attribute-set/yaml-encoder.ts`) now match
`vendor/rails/activemodel/lib/active_model/attribute_set/yaml_encoder.rb:8,12,22`
in arity and parameter order (trails#7436), but the two BODIES still carry a
trails-invented envelope rather than Rails' payload.

Rails writes one key and preserves the `Attribute` objects themselves:

```ruby
def encode(attribute_set, coder)                       # yaml_encoder.rb:12
  coder["concise_attributes"] = attribute_set.each_value.map do |attr|
    if attr.type.equal?(default_types[attr.name])      # :14
      attr.with_type(nil)                              # :15
    else
      attr
    end
  end
end

def decode(coder)                                      # :22
  if coder["attributes"]                               # :23
    coder["attributes"]
  else
    attributes_hash = Hash[coder["concise_attributes"].map do |attr|
      if attr.type.nil?                                # :27
        attr = attr.with_type(default_types[attr.name])
      end
      [attr.name, attr]
    end]
    AttributeSet.new(attributes_hash)                  # :32
  end
end
```

trails instead writes `v` / `types` / `values` / `defaultAttributes`: the type
travels as a `typeRegistry` key rather than the object, an `Uninitialized`
attribute travels as a name in a side-channel list rather than as itself, every
other `Attribute` subclass and its `originalAttribute` are dropped, and `decode`
rejects any payload without `v === 1` and has no arm for Rails' legacy
`coder["attributes"]` (`:23`).

The envelope predates the signature work — it arrived with the file (#6511) —
and is the shape `codecs/json.ts` and `codecs/yaml.ts` serialize.

## Prerequisite

`attr.with_type(nil)` (`:15`) has no trails spelling today:
`Attribute#type` is `Type` and `withType(type: Type)`
(`packages/activemodel/src/attribute.ts:158`, and the `Uninitialized` /
`WithCastValue` overrides at `:304`, `:344`) do not admit `null`. Rails' `nil`
type IS the wire signal that means "restore the default type", so the port needs
`type: Type | null` on `Attribute` before `encode` can express `:14-15` and
`decode` can express `:27`. That is a cross-cutting change to a field read
throughout activemodel and activerecord, which is why it is not folded into the
signature story.

## Converged shape

- `Attribute#type` is `Type | null` and `withType` accepts `null`, so
  `attr.withType(null)` is expressible.
- `encode` writes a single `conciseAttributes` key holding `Attribute` objects,
  mirroring `:13-19` line for line.
- `decode` returns `coder.attributes` when present (`:23`), else rebuilds from
  `conciseAttributes`, restoring `defaultTypes[attr.name]` only when
  `attr.type == null` (`:27`), then `new AttributeSet(attributesHash)` (`:32`).
- Serializing an `Attribute` to and from a string moves to `codecs/json.ts` and
  `codecs/yaml.ts` — the Psych seat — along with the type-registry lookup, the
  schema-drift warning, and the `v` version check that today live in the
  encoder.

## Acceptance criteria

- [ ] `encode` writes `conciseAttributes` only, and applies `withType(null)` to
      an attribute whose type is its default type (`yaml_encoder.rb:14-15`).
- [ ] `decode` carries both arms of `:23`, and restores the default type only
      on a null type (`:27`).
- [ ] `Uninitialized` and the other `Attribute` subclasses survive a round trip
      as themselves, with no `defaultAttributes` side channel.
- [ ] The codecs own envelope versioning, registry lookup and drift warnings;
      `yaml-encoder.ts` names none of them.
- [ ] `pnpm parity:api` deltas non-negative; call and call-arg gates green.
