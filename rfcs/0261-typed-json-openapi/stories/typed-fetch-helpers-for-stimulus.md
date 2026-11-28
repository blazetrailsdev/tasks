---
title: "stimulus: typed fetch helpers generated from the OpenAPI document"
status: draft
updated: 2026-11-28
rfc: "0261-typed-json-openapi"
cluster: follow-ons
packages: [stimulus, trails-tsc]
deps: [openapi-json-schema-converter, openapi-request-bodies-from-permit]
deps-rfc: []
est-loc: 400
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

RFC § Follow-ons. An app on Turbo and Stimulus, with no SPA, still calls JSON
endpoints from controllers (autosave, search-as-you-type, inline edits), with
hand-written `fetch` and untyped `response.json()`. The `openapi` plugin already
knows every operation's path, params, request body and response, so it can emit
a small typed module: one function per operation, keyed by Rails route name
(`postsPath` → `api.posts.index()`), sending the CSRF token from
`<meta name="csrf-token">` the way `@rails/request.js` does.

## Acceptance criteria

- [ ] `trails-tsc --openapi` can also write `app/javascript/api.generated.ts`,
      behind a config flag.
- [ ] Each function's parameters and return type come from the document. A wrong
      body key or path param is a type error in a Stimulus controller.
- [ ] Non-GET requests send `X-CSRF-Token`, and a 422 response resolves to the
      typed error body rather than throwing.
- [ ] It doesn't depend on any runtime package beyond `fetch`.
