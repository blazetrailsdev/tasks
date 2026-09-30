---
title: "activemodel: restore the 11 dropped Rails branches (report-arms missing rows)"
status: ready
updated: 2026-09-30
rfc: "0173-activemodel-parity-100"
cluster: arms
packages: ["activemodel"]
deps: ["activemodel-converge-secure-password-bcrypt-password"]
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:api:arms:report --package=activemodel --direction=missing` (report-only, RFC 0113):

- `packages/activemodel/src/attribute-mutation-tracker.ts#cloneValue` — `-try -if -rescue`
- `packages/activemodel/src/attribute-set.ts#keys` — `-loop +if`
- `packages/activemodel/src/attribute-set.ts#accessed` — `-loop +if`
- `packages/activemodel/src/attribute-set/yaml-encoder.ts#encode` — `-loop`
- `packages/activemodel/src/attribute/user-provided-default.ts#marshalLoad` — `-if`
- `packages/activemodel/src/errors.ts#import` — `-loop +if`
- `packages/activemodel/src/secure-password.ts#hasSecurePassword` — `-try -rescue -throw`
- `packages/activemodel/src/serializers/json.ts#asJson` — `-if -if`
- `packages/activemodel/src/type/string.ts#castValue` — `-if -if`
- `packages/activemodel/src/validations/validates.ts#validates` — `-try -rescue +if`
- `packages/activemodel/src/validations/with.ts#validatesWith` — `-if -loop`

## Acceptance criteria

- [ ] Each pair's branches match its Rails body (CLAUDE.md § "Control flow").
- [ ] The report shows 0 activemodel missing rows.

## Verification

```bash
pnpm parity:api --calls && pnpm parity:api:arms:report --package=activemodel && pnpm parity:api:arms:throws && pnpm parity:api:blocks && pnpm parity:api:returns
```
