---
title: "activemodel: remove or credit the 51 invented branches outside type/"
status: ready
updated: 2026-09-30
rfc: "0173-activemodel-parity-100"
cluster: arms
packages: ["activemodel"]
deps: ["activemodel-converge-missing-control-flow-arms"]
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

`pnpm parity:api:arms:report --package=activemodel --direction=invented`, the non-`type/` rows:

- `packages/activemodel/src/attribute-assignment.ts#_assignAttribute` — `+if +if +throw`
- `packages/activemodel/src/attribute-methods.ts#match` — `+if +if +if +if`
- `packages/activemodel/src/attribute-mutation-tracker.ts#isChanged` — `+if +if +if`
- `packages/activemodel/src/attribute-set.ts#toHash` — `+loop`
- `packages/activemodel/src/attribute-set.ts#keys` — `-loop +if`
- `packages/activemodel/src/attribute-set.ts#fetchValue` — `+if`
- `packages/activemodel/src/attribute-set.ts#accessed` — `-loop +if`
- `packages/activemodel/src/attribute-set.ts#reverseMergeBang` — `+loop +if`
- `packages/activemodel/src/attribute-set/builder.ts#fetchValue` — `+if +if +if +if`
- `packages/activemodel/src/attribute-set/builder.ts#defaultAttribute` — `+if +if`
- `packages/activemodel/src/attribute-set/builder.ts#assignDefaultValue` — `+if`
- `packages/activemodel/src/attribute.ts#changedFromAssignment` — `+if`
- `packages/activemodel/src/attribute/user-provided-default.ts#valueBeforeTypeCast` — `+if`
- `packages/activemodel/src/conversion.ts#toKey` — `+if`
- `packages/activemodel/src/conversion.ts#toParam` — `+if +if`
- `packages/activemodel/src/conversion.ts#_toPartialPath` — `+if`
- `packages/activemodel/src/error.ts#match` — `+if +if`
- `packages/activemodel/src/error.ts#inspect` — `+try +rescue`
- `packages/activemodel/src/error.ts#generateMessage` — `+if +if`
- `packages/activemodel/src/errors.ts#import` — `-loop +if`
- `packages/activemodel/src/errors.ts#asJson` — `+loop`
- `packages/activemodel/src/errors.ts#toHash` — `+loop`
- `packages/activemodel/src/errors.ts#details` — `+loop`
- `packages/activemodel/src/errors.ts#groupByAttribute` — `+loop +if`
- `packages/activemodel/src/lint.ts#model` — `+if`
- `packages/activemodel/src/lint.ts#assertBoolean` — `+if +throw`
- `packages/activemodel/src/model.ts#constructor` — `+try`
- `packages/activemodel/src/naming.ts#constructor` — `+if +if +if +if`
- `packages/activemodel/src/naming.ts#i18nKeys` — `+if`
- `packages/activemodel/src/secure-password.ts#constructor` — `+if +if`
- `packages/activemodel/src/serializers/json.ts#fromJson` — `+if`
- `packages/activemodel/src/validations.ts#constructor` — `+if`
- `packages/activemodel/src/validations.ts#isValid` — `+if +if`
- `packages/activemodel/src/validations.ts#validateBang` — `+if`
- `packages/activemodel/src/validations/acceptance.ts#validateEach` — `+if`
- `packages/activemodel/src/validations/acceptance.ts#defineOn` — `+loop +if +if`
- `packages/activemodel/src/validations/callbacks.ts#setOptionsForCallback` — `+if +if +if +if +if +if`
- `packages/activemodel/src/validations/clusivity.ts#checkValidityBang` — `+if +throw`
- `packages/activemodel/src/validations/clusivity.ts#delimiter` — `+if +if`
- `packages/activemodel/src/validations/comparison.ts#validateEach` — `+if +if +throw`
- `packages/activemodel/src/validations/confirmation.ts#validateEach` — `+if`
- `packages/activemodel/src/validations/format.ts#validateEach` — `+if`
- `packages/activemodel/src/validations/length.ts#constructor` — `+if`
- `packages/activemodel/src/validations/length.ts#validateEach` — `+if +if`
- `packages/activemodel/src/validations/numericality.ts#checkValidityBang` — `+if +if`
- `packages/activemodel/src/validations/numericality.ts#validateEach` — `+if +if +if +if`
- `packages/activemodel/src/validations/numericality.ts#parseAsNumber` — `+if +if`
- `packages/activemodel/src/validations/resolve-value.ts#resolveValue` — `+if +throw +if`
- `packages/activemodel/src/validations/validates.ts#validates` — `-try -rescue +if`
- `packages/activemodel/src/validations/with.ts#validateEach` — `+if +throw +if`
- `packages/activemodel/src/validator.ts#validate` — `+if`

`activemodel/validator.ts#validate` is also the one activemodel row in `pnpm parity:api:returns`
(a Rails caller reads its return value; the port returns void) — fix it here.

## Acceptance criteria

- [ ] Real invented guards removed; false positives fixed in the extractor with a test.
- [ ] `pnpm parity:api:arms:report --package=activemodel` shows 0 rows; `pnpm parity:api:returns` shows no activemodel pair.
