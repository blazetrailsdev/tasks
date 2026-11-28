---
title: "trails-tsc: openapi plugin writes an OpenAPI 3.1 document from routes and render types"
status: draft
updated: 2026-11-27
rfc: "0000-typed-json-openapi"
cluster: openapi
packages: [trails-tsc]
deps: [activerecord-asjson-returns-serialized, render-json-option-carries-body-type]
deps-rfc: []
est-loc: 700
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

RFC § Design 4. A `trails-tsc` plugin beside `tse` pairs each route with the
`render({ json })` types of its action and writes `tmp/openapi.json`.

## Acceptance criteria

- [ ] A fixture app's document is snapshot-tested and passes an OpenAPI 3.1 validator.
- [ ] String-literal unions become `enum`, nullables become `type: [..., "null"]`, and each
      distinct `status` is a separate response.
- [ ] `--check` exits non-zero when the document differs from the committed copy.
- [ ] An action whose JSON type is `unknown` / `Record<string, unknown>` is
      reported as a warning naming the controller and action, not silently omitted.
