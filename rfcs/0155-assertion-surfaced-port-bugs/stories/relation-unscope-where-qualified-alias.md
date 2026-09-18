---
title: "relation-unscope-where-qualified-alias"
status: draft
updated: 2026-09-18
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced converging `relations_test.rb` assertions (assertions-relations-test, RFC 0132). The converged test is parked `it.skip` in `packages/activerecord/src/relations.test.ts`: **"unscope with aliased column"**.

- Rails: activerecord relations_test.rb:2283 ; relation/where_clause.rb unscope handling
- trails: packages/activerecord/src/relation/where-clause.ts
- Observed: unscope({ where: "posts.text" }) does not remove the predicate written through the text alias, so 1 row is returned instead of 3

## Acceptance criteria

- The parked test in `relations.test.ts` is un-skipped (its BLOCKED line removed) and passes with its Rails assertions unchanged.
- The behaviour matches the Rails source cited above, method by method.
