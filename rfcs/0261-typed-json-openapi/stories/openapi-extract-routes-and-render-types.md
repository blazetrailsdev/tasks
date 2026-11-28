---
title: "trails-tsc openapi: pair routes with each action's render({ json }) types and emit a document with inline schemas"
status: ready
updated: 2026-11-28
rfc: "0261-typed-json-openapi"
cluster: openapi
packages: [trails-tsc]
deps: [render-json-option-carries-body-type]
deps-rfc: []
est-loc: 450
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

RFC § Design 4, steps 1, 2 and 4. Add a `trails-tsc` plugin beside `tse`. It
evaluates `config/routes.ts` through the route set's inspector (Open question
4), finds each action's `render({ json, status })` calls, and writes
`tmp/openapi.json` with schemas inline. JSON Schema for each type comes from
`ts-json-schema-generator`'s formatter as-is; `$ref` components belong to
`openapi-json-schema-converter`.

## Acceptance criteria

- [ ] A fixture app (a `posts` resource with `index`, `show` and a 422 `create`)
      produces one operation per route, with a response per distinct `status`.
- [ ] An action whose JSON type is `unknown` / `Record<string, unknown>` is
      reported as a warning naming the controller and action, not silently omitted.
- [ ] The document passes an OpenAPI 3.1 validator.

## Verification

`pnpm vitest run packages/trails-tsc/test/plugins/openapi.test.ts`. The snapshot
is `packages/trails-tsc/test/plugins/__snapshots__/openapi.test.ts.snap`.
