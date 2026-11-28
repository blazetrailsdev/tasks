---
title: "actionpack: render({ json }) carries the body's type"
status: draft
updated: 2026-11-28
rfc: "0261-typed-json-openapi"
cluster: openapi
packages: [actionpack]
deps: [activerecord-asjson-returns-serialized]
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

RFC § Design 3. `RenderOptions.json` is `unknown`
(`packages/actionpack/lib/action-controller/base.ts:223`). Make the body's
type recoverable from the call, so the OpenAPI plugin can read it, and type a
bare model or relation as its no-option `Serialized`.

## Acceptance criteria

- [ ] The checker can read `J` from `this.render({ json: x, status })` at the call
      site (type test through a helper that captures `J`).
- [ ] `this.render({ json: post })` with a bare model types the body as
      `Serialized<Post>`, and with a relation as `Serialized<Post>[]`.
- [ ] The existing `RenderArgs` type tests from trails#8315 / trails#9199 still pass.
