---
title: "Delete the invented AttributeSet yamlCodec (no non-test caller)"
status: draft
updated: 2026-09-29
rfc: "0170-psych-in-ruby-compat"
cluster: fidelity
packages: ["activemodel"]
deps: ["psych-object-protocol-for-record-yaml-round-trip"]
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/activemodel/src/attribute-set/codecs/yaml.ts` (`yamlCodec`,
`@noRailsEquivalent PERMANENT`) wraps npm `parse` / `stringify` around an
invented `AttributeSetEnvelope` (`codecs/codec.ts`). Nothing outside its own
tests calls it (`grep -rn yamlCodec packages/*/src`). Rails' YAML path for an
attribute set is `YAMLEncoder`
(`vendor/rails/v8.0.2/activemodel/lib/active_model/attribute_set/yaml_encoder.rb`) driven by
Psych, which #8254 wires. `jsonCodec` (`codecs/json.ts`) is the same invention
without YAML, and only `yaml-encoder.trails.test.ts:104-109` uses it.

## Acceptance criteria

- [ ] `codecs/yaml.ts` and `codecs/yaml.trails.test.ts` are deleted, along with
      the yaml half of `codec.trails.test.ts`.
- [ ] `jsonCodec` and the envelope types are deleted too if
      `yaml-encoder.trails.test.ts` can assert through `YAMLEncoder` alone.
      Otherwise file a story for them with this context.
- [ ] `parity:api:extra:gate` passes (tighten activemodel).

## Verification

`pnpm vitest run packages/activemodel/src/attribute-set/`.
