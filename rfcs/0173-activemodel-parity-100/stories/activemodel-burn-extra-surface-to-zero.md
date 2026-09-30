---
title: "activemodel: burn extra surface (novel 1, moved 24) to zero"
status: ready
updated: 2026-09-30
rfc: "0173-activemodel-parity-100"
cluster: placement
packages: ["activemodel"]
deps: ["delete-attribute-set-yaml-codec", "override-of-inherited-rails-member-scores-moved"]
deps-rfc: []
est-loc: 450
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

activemodel is not in the extra-surface gate (`scripts/api-compare/extra-surface-mark.json` lists only
`arel` and `ruby-compat`; activerecord is rowless). `pnpm parity:api:extra --package activemodel`
measures **novel 1, moved 24, total 25** (allowed 58, no-counterpart 8):

- `packages/activemodel/src/validations/_accessor.ts` — `inspectAccessor`
- `packages/activemodel/src/validations.ts` — `InstanceMethods`, `name`, `raiseOnMissingTranslations`, `toString`
- `packages/activemodel/src/attribute-set/codecs/json.ts` — `decode`, `encode`
- `packages/activemodel/src/attribute-set/codecs/yaml.ts` — `decode`, `encode`
- `packages/activemodel/src/index.ts` — `AttributeMethods`, `Types`
- `packages/activemodel/src/serializers/json.ts` — `attributes`, `setAttributes`
- `packages/activemodel/src/attribute-assignment.ts` — `methodMissing`
- `packages/activemodel/src/attribute-methods.ts` — `InstanceMethods`
- `packages/activemodel/src/attribute-mutation-tracker.ts` — `instance`
- `packages/activemodel/src/attribute-set/codecs/codec.ts` — `constructor`
- `packages/activemodel/src/attribute.ts` — `deepDup`
- `packages/activemodel/src/error.ts` — `deepDup`
- `packages/activemodel/src/forbidden-attributes-protection.ts` — `constructor`
- `packages/activemodel/src/lint.ts` — `constructor`
- `packages/activemodel/src/type/binary.ts` — `bytes`
- `packages/activemodel/src/type/helpers/accepts-multiparameter-time.ts` — `valueFromMultiparameterAssignment`
- `packages/activemodel/src/type/value.ts` — `serializeCastValue`
- `packages/activemodel/src/validations/with.ts` — `checkValidityBang`

Plus one report-only _inlined_ body: `type/value.ts` `constructor` inlined from
`type/serialize_cast_value.rb` (`initialize`).

`attribute-set/codecs/*` has no Rails counterpart; `delete-attribute-set-yaml-codec` (RFC 0170) deletes
the YAML codec and the JSON codec follows the same reasoning. `deepDup` on `attribute.ts` / `error.ts`
is ActiveSupport's `Object#deep_dup` overridden per class — the relocation or a scorer credit decides it.

## Acceptance criteria

- [ ] Every name above is relocated to the file mirroring its defining `.rb`, deleted, or credited by a scorer fix with a test (`override-of-inherited-rails-member-scores-moved`, RFC 0120).
- [ ] The `serialize_cast_value.rb` constructor body lives in `type/serialize-cast-value.ts`, included into `Value`.
- [ ] `pnpm parity:api:extra --package activemodel` reports novel 0, total 0, no inlined bodies.

## Verification

```bash
pnpm parity:api:extra --package activemodel && pnpm parity:api:moves && pnpm parity:api:extra:gate && pnpm lint --fix
```
