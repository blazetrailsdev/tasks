---
title: "trails-tsc openapi: request bodies and path params"
status: draft
updated: 2026-11-28
rfc: "0261-typed-json-openapi"
cluster: openapi
packages: [trails-tsc]
deps: [openapi-extract-routes-and-render-types, permit-returns-literal-typed-params]
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

RFC § Design 5. Emit `requestBody` from each action's typed `permit`, and path
parameters from the route pattern.

## Acceptance criteria

- [ ] The fixture app's `create` / `update` operations carry request body schemas.
- [ ] `/posts/:id` produces a required `id` path parameter.
