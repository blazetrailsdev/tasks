---
title: "YAMLEncoder#decode resolves types through the registry with a warn-and-default rescue Rails has not"
status: closed
updated: 2026-09-06
rfc: "0113-branch-and-guard-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 130
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Delivered: origin/main packages/activemodel/src/attribute-set/yaml-encoder.ts#decode already mirrors yaml_encoder.rb:21-33 — a nil type is answered from this.defaultTypes[attr.name], and the three invented pieces the story names are all gone: no type key in the serialized form, no registry.lookup round-trip, no warn-and-default rescue and no silenceDriftWarnings (git grep 'silenceDriftWarnings|registry.lookup' origin/main -- packages/activemodel/src/attribute-set/yaml-encoder.ts returns nothing; the file is 41 lines and imports no registry). Premise gone."
---

## Context

Surfaced while dropping the invented `:value` type registration in PR #7427
(`type-registries-register-nonexistent-value-type-name`). The third caller of
the invented name lives in `YAMLEncoder#decode`, inside an arm Rails does not
have.

Rails (`vendor/rails/activemodel/lib/active_model/attribute_set/yaml_encoder.rb:21-33`):

```ruby
def decode(coder)
  if coder["attributes"]
    coder["attributes"]
  else
    attributes_hash = Hash[coder["concise_attributes"].map do |attr|
      if attr.type.nil?
        attr = attr.with_type(default_types[attr.name])
      end
      [attr.name, attr]
    end]
    AttributeSet.new(attributes_hash)
  end
end
```

A nil type is answered from `default_types[attr.name]` — the hash the encoder
was constructed with (`yaml_encoder.rb:8`). There is no registry, no type NAME
in the payload, and no fallback: a name absent from `default_types` yields
`nil`, which `with_type` stores as-is.

`packages/activemodel/src/attribute-set/yaml-encoder.ts`'s `decode` instead
serializes a type KEY into the payload and resolves it back through the type
registry, with an invented drift-warning fallback:

```ts
try {
  type = this.registry.lookup(typeKey);
} catch {
  if (!this.silenceDriftWarnings && !warnedKeys.has(typeKey)) { ... console.warn(...) }
  type = defaultValue();
}
```

Three invented pieces: the type key in the serialized form, the registry
round-trip that resolves it, and the warn-and-default rescue. The rescue is
what made the invented `:value` registration reachable from here.

Related: `yaml-encoder-coder-is-per-call-not-per-encoder` (RFC 0134) covers the
SIGNATURE deviation — `coder` at construction rather than per call. This story
is the decode BODY's type-resolution arm; the two touch the same file and
should probably be sequenced together, but they are separate deviations.

## Converged shape

`decode` resolves a nil type from `defaultTypes[attr.name]`, as
`yaml_encoder.rb:26-28` does, and carries no type key, no registry lookup and
no rescue.

## Acceptance criteria

- [ ] A nil type is answered from `defaultTypes[name]`, mirroring
      `yaml_encoder.rb:26-28`.
- [ ] The registry lookup, the type key in the serialized form, the
      drift-warning and `silenceDriftWarnings` are all gone.
- [ ] Round-trip coverage for the `attributes` and `concise_attributes` arms
      still passes.
- [ ] `parity:api:extra` delta non-negative — `silenceDriftWarnings` leaving
      should LOWER it.
