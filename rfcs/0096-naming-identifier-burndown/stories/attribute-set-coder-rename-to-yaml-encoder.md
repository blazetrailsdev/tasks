---
title: "attribute-set-coder-rename-to-yaml-encoder"
status: done
updated: 2026-08-14
rfc: "0096-naming-identifier-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6511
claim: "2026-08-14T10:27:06Z"
assignee: "attribute-set-coder-rename-to-yaml-encoder"
blocked-by: null
closed-reason: null
---

## Context

`packages/activemodel/src/attribute-set/coder.ts` is trails' port of
`vendor/rails/activemodel/lib/active_model/attribute_set/yaml_encoder.rb`, but
it is named `AttributeSetCoder` in `attribute-set/coder.ts`, so `parity:api`
buckets the whole file as `[no Rails counterpart]` and none of its surface is
measured.

PR #6474 (RFC 0096 wave 3, item 6) reshaped the class to Rails'
`YAMLEncoder.new(default_types)` contract — `encode` drops the type of an
attribute whose type is the default (`yaml_encoder.rb:14-18`) and `decode`
restores it (`:27-29`) — but deliberately left the name alone: the rename is
what makes the file Rails-matched, and once it is, every remaining trails-only
name in it becomes measured extra surface needing its own decision.

Names to resolve when the file becomes Rails-matched:

- `AttributeSetCoderError` — Rails raises nothing here.
- `AttributeSetCodec` / `AttributeSetEnvelope` / the `codec` option and the
  `attribute-set/codecs/` directory — the wire format Psych supplies in Ruby.
- The `registry` and `silenceDriftWarnings` options — needed because JSON
  cannot dump a `Type` object the way Psych can.

## Acceptance criteria

- [ ] `AttributeSetCoder` is `YAMLEncoder` in
      `packages/activemodel/src/attribute-set/yaml-encoder.ts`, with callers
      (`activemodel/src/index.ts`, `activerecord/src/model-schema.ts#yamlEncoder`,
      `attribute-set/codecs/*`) updated.
- [ ] `pnpm parity:api` shows the file matched against `yaml_encoder.rb`.
- [ ] Every remaining trails-only public name in the file is either removed,
      folded into a ported method, or carries a `@noRailsEquivalent <reason>`
      naming the specific shortcoming. No allowlist row.
- [ ] `pnpm parity:api:extra --package activemodel` does not grow.
