---
title: "relation-unscope-where-hash"
status: in-progress
updated: 2026-09-25
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: trails#8086
claim: "2026-09-25T14:31:42Z"
assignee: "relation-find-by-bang-no-arguments"
blocked-by: null
closed-reason: null
---

## Context

Surfaced converging `relations_test.rb` assertions (assertions-relations-test, RFC 0132). The converged test is parked `it.skip` in `packages/activerecord/src/relations.test.ts`: **"unscope with table name qualified hash"**.

- Rails: activerecord relations_test.rb:2302 (unscope(where: { posts: :id }))
- trails: packages/activerecord/src/relation/query-methods.ts unscope
- Observed: unscope({ where: { posts: "id" } }) does not remove the posts.id predicate (result stays empty)

## Acceptance criteria

- The parked test in `relations.test.ts` is un-skipped (its BLOCKED line removed) and passes with its Rails assertions unchanged.
- The behaviour matches the Rails source cited above, method by method.
