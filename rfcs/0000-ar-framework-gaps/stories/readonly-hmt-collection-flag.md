---
title: "HMT collection not implicitly marked readonly"
status: ready
updated: 2026-06-04
rfc: "0000-ar-framework-gaps"
cluster: readonly
deps: []
deps-rfc: []
est-loc: 60
priority: 35
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

From `readonly-test-framework-gaps.md`. `post.people` (through readers) must
return records NOT marked readonly; `posts(:welcome).people.find(id/first/last)`
must also be non-readonly. Post already has `hasMany("people", { through:
"readers" })`; the through-join path must not propagate the readonly flag to
loaded records.

## Acceptance criteria

- [ ] HMT-through readers don't mark loaded records readonly.
- [ ] Un-skips: `has many with through is not implicitly marked readonly`,
      `…while finding by id`, `…while finding first`, `…while finding last` (4).

## Notes

Rails: through-association readonly semantics (`readonly_test.rb`).
