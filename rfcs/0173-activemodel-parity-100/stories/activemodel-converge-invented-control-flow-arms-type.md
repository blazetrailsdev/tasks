---
title: "activemodel: remove or credit the 29 invented branches under type/"
status: ready
updated: 2026-09-30
rfc: "0173-activemodel-parity-100"
cluster: arms
packages: ["activemodel"]
deps: ["activemodel-converge-missing-control-flow-arms"]
deps-rfc: []
est-loc: 350
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:api:arms:report --package=activemodel --direction=invented`, the `type/` rows. Each is
either an invented guard to delete or an extractor false positive to fix in `scripts/api-compare/`:

- `packages/activemodel/src/type/binary.ts#constructor` — `+if`
- `packages/activemodel/src/type/binary.ts#equals` — `+if +if +if +if +loop +if`
- `packages/activemodel/src/type/date-time.ts#castValue` — `+if +if +if +if +if +if`
- `packages/activemodel/src/type/date-time.ts#microseconds` — `+if +if`
- `packages/activemodel/src/type/date-time.ts#fallbackStringToTime` — `+throw +if`
- `packages/activemodel/src/type/date.ts#castValue` — `+if +if +if +if`
- `packages/activemodel/src/type/date.ts#fallbackStringToDate` — `+throw +if`
- `packages/activemodel/src/type/date.ts#newDate` — `+if`
- `packages/activemodel/src/type/decimal.ts#typeCastForSchema` — `+if`
- `packages/activemodel/src/type/decimal.ts#castValue` — `+if`
- `packages/activemodel/src/type/decimal.ts#floatPrecision` — `+if`
- `packages/activemodel/src/type/decimal.ts#applyScale` — `+if +if`
- `packages/activemodel/src/type/float.ts#typeCastForSchema` — `+if`
- `packages/activemodel/src/type/float.ts#castValue` — `+if +if +if`
- `packages/activemodel/src/type/helpers/accepts-multiparameter-time.ts#constructor` — `+if`
- `packages/activemodel/src/type/helpers/numeric.ts#cast` — `+if`
- `packages/activemodel/src/type/helpers/numeric.ts#isEqualNan` — `+if`
- `packages/activemodel/src/type/helpers/numeric.ts#isNumberToNonNumber` — `+if +if`
- `packages/activemodel/src/type/helpers/time-value.ts#applySecondsPrecision` — `+if`
- `packages/activemodel/src/type/helpers/time-value.ts#userInputInTimeZone` — `+if +if +if +if +if +if +if`
- `packages/activemodel/src/type/helpers/time-value.ts#newTime` — `+if`
- `packages/activemodel/src/type/helpers/time-value.ts#fastStringToTime` — `+throw`
- `packages/activemodel/src/type/immutable-string.ts#serialize` — `+if`
- `packages/activemodel/src/type/integer.ts#isInRange` — `+if +if +if`
- `packages/activemodel/src/type/integer.ts#castValue` — `+if +if +if +if +if`
- `packages/activemodel/src/type/value.ts#constructor` — `+if +if +if`
- `packages/activemodel/src/type/time.ts#userInputInTimeZone` — `+throw +if +if +if`
- `packages/activemodel/src/type/time.ts#castValue` — `+if +if +if +if +if +throw +if`
- `packages/activemodel/src/type/value.ts#constructor` — `+if +if +if`

## Acceptance criteria

- [ ] Real invented guards removed; false positives fixed in the extractor with a test.
- [ ] The report shows 0 activemodel invented rows under `type/`.
