---
title: "activemodel: Error#generate_message and Type::Decimal#cast_value duck-type as Rails does"
status: ready
updated: 2026-09-30
rfc: "0173-activemodel-parity-100"
cluster: arms
packages: ["activemodel"]
deps:
  ["parity-100-rehome-postponed-rfc-dependencies", "clusivity-check-validity-duck-types-delimiter"]
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:api:duck-types` lists three activemodel pairs whose Rails body asks `respond_to?` /
`acts_like?` and whose port asks `instanceof`:

- `error.ts#generateMessage` ← `vendor/rails/v8.0.2/activemodel/lib/active_model/error.rb:64`
- `type/decimal.ts#castValue` ← `vendor/rails/v8.0.2/activemodel/lib/active_model/type/decimal.rb:58`
- `validations/clusivity.ts#checkValidityBang` — owned by `clusivity-check-validity-duck-types-delimiter` (RFC 0082).

CLAUDE.md § "Ruby protocol methods with a different JS mechanism": `respond_to?` is `rbObjRespondTo`.

## Acceptance criteria

- [ ] The two bodies test `rbObjRespondTo(value, "...")` where Rails tests `respond_to?`.
- [ ] `pnpm parity:api:duck-types` lists no activemodel pair once the RFC 0082 story lands.

## Verification

```bash
pnpm parity:api --calls && pnpm parity:api:arms:report --package=activemodel && pnpm parity:api:arms:throws && pnpm parity:api:blocks && pnpm parity:api:returns
```
