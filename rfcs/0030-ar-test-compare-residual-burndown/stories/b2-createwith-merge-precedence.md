---
title: "createWith merge precedence (last-wins)"
status: in-progress
updated: 2026-06-15
rfc: "0030-ar-test-compare-residual-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: 3415
claim: "2026-06-15T23:04:26Z"
assignee: "b2-createwith-merge-precedence"
blocked-by: null
---

## Context

Surfaced by RFC 0030 story b2-default-scoping. The Rails test
`test_create_with_merge` (activerecord/test/cases/scoping/default_scoping_test.rb)
is ported but skipped in
`packages/activerecord/src/scoping/default-scoping.test.ts` ("create with merge").

`createWith` merge precedence is unimplemented: merging a later `createWith({name:"Aaron"})`
into an earlier `createWith({name:"foo", salary:20})` should let the later value win
("Aaron"), but the engine keeps "foo". Rails' `create_with` values merge with
last-wins precedence.

## Acceptance criteria

- [ ] `PoorDeveloperCalledJamis.createWith({name:"foo",salary:20}).merge(PoorDeveloperCalledJamis.createWith({name:"Aaron"})).new()` yields name "Aaron", salary 20.
- [ ] Un-skip "create with merge" in default-scoping.test.ts; it passes on sqlite.
