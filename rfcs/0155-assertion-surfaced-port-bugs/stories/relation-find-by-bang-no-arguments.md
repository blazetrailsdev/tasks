---
title: "relation-find-by-bang-no-arguments"
status: in-progress
updated: 2026-09-25
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: trails#8086
claim: "2026-09-25T14:31:42Z"
assignee: "relation-find-by-bang-no-arguments"
blocked-by: null
closed-reason: null
---

## Context

Surfaced converging `relations_test.rb` assertions (assertions-relations-test, RFC 0132). The converged test is parked `it.skip` in `packages/activerecord/src/relations.test.ts`: **"find_by requires at least one argument"**.

- Rails: activerecord/lib/active_record/relation/finder_methods.rb:117 (find_by!(arg, \*args) requires an argument)
- trails: packages/activerecord/src/relation/finder-methods.ts findByBang
- Observed: Post.all().findByBang() raises TypeError (this.where(...).take is not a function) instead of ArgumentError

## Acceptance criteria

- The parked test in `relations.test.ts` is un-skipped (its BLOCKED line removed) and passes with its Rails assertions unchanged.
- The behaviour matches the Rails source cited above, method by method.
