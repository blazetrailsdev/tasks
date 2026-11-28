---
title: "trails-tsc openapi: named components.schemas refs, enums and nullables"
status: draft
updated: 2026-11-27
rfc: "0261-typed-json-openapi"
cluster: openapi
packages: [trails-tsc]
deps: [openapi-extract-routes-and-render-types]
deps-rfc: []
est-loc: 350
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

RFC § Design 4, step 3, sized on `ts-json-schema-generator`'s formatter (Open
question 3). Hoist each model shape into `components.schemas`, keyed by model
name plus a hash of its serialize options, so two different `only:` shapes of
`Post` don't collide.

## Acceptance criteria

- [ ] String-literal unions are `enum`, and `T | null` is `type: [..., "null"]`.
- [ ] An optional include key (a nil-able association) is absent from `required`.
- [ ] The same model with two option sets yields two components, and identical
      option sets share one.

## Verification

`pnpm vitest run packages/trails-tsc/test/plugins/openapi-schema.test.ts`.
