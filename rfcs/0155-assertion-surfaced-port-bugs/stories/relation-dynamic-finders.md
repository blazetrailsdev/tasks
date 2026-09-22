---
title: "relation-dynamic-finders"
status: ready
updated: 2026-09-22
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced converging `relations_test.rb` assertions (assertions-relations-test, RFC 0132). The converged test is parked `it.skip` in `packages/activerecord/src/relations.test.ts`: **"dynamic finder", "respond to dynamic finders", "dynamic find by attributes", "dynamic find by attributes bang"**.

- Rails: activerecord/lib/active_record/dynamic_matchers.rb:6 (respond_to_missing?), relation/delegation.rb:150
- trails: packages/activerecord/src/relation/delegation.ts, model dynamic matchers
- Observed: assertRespondTo(Post, "findById") and assertRespondTo(relation, "findByTitle") fail; findById / findByIdAndName / findByIdBang are not defined on Relation or the model

## Acceptance criteria

- The parked test in `relations.test.ts` is un-skipped (its BLOCKED line removed) and passes with its Rails assertions unchanged.
- The behaviour matches the Rails source cited above, method by method.
