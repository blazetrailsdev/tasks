---
title: "Collection-proxy readonly propagation"
status: ready
rfc: "0000-ar-framework-gaps"
cluster: readonly
deps: []
deps-rfc: []
est-loc: 40
priority: 36
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

From `readonly-test-framework-gaps.md` (port of Rails `readonly_test.rb`).
`post.comments` returns a proxy that must support `.any(&:readonly?)` and
`.readonly(true).all(&:readonly?)` as a chainable relation. Post already has
`hasMany("comments")`; the proxy needs a chainable `.readonly(value)` accessor
and `any()` / `all()` iterators.

## Acceptance criteria

- [ ] Collection proxy exposes a chainable `.readonly(value)` + `any()` / `all()`.
- [ ] Un-skips: `has many find readonly` (1).

## Notes

Rails: `readonly_test.rb` + association readonly propagation.
