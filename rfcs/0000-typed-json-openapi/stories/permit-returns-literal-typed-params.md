---
title: "actionpack: require(...).permit(...) returns params typed by the permitted keys"
status: draft
updated: 2026-11-27
rfc: "0000-typed-json-openapi"
cluster: typed-serialization
packages: [actionpack]
deps: []
deps-rfc: []
est-loc: 400
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

RFC § Design 5. Strong params return `Parameters` with untyped values. A literal
`permit("title", "body")` should yield a type keyed by those names, so it can
become the action's `requestBody`.

## Acceptance criteria

- [ ] `params.require("post").permit("title")` exposes `title` and rejects `body` at the type level.
- [ ] Nested `permit({ tags: [] })` types `tags` as an array.
- [ ] Runtime is unchanged.
