---
title: "Collection-proxy readonly propagation"
status: done
updated: 2026-06-06
rfc: "0015-ar-framework-gaps"
cluster: readonly
deps: []
deps-rfc: []
est-loc: 40
priority: 36
pr: 2968
claim: "2026-06-06T13:31:11Z"
assignee: "readonly-collection-proxy-propagation"
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
