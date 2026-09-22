---
title: "relation-inspect-loads-limited-records"
status: ready
updated: 2026-09-22
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 100
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced converging `relations_test.rb` assertions (assertions-relations-test, RFC 0132). The converged test is parked `it.skip` in `packages/activerecord/src/relations.test.ts`: **"relations don't load all records in #inspect", "loading query is annotated in #inspect"**.

- Rails: activerecord/lib/active_record/relation.rb:1290 (inspect loads annotate("loading for inspect").limit(11))
- trails: packages/activerecord/src/relation.ts:390-398
- Observed: Relation#inspect is synchronous and returns "#<Relation [...]>" for an unloaded relation without querying

## Acceptance criteria

- The parked test in `relations.test.ts` is un-skipped (its BLOCKED line removed) and passes with its Rails assertions unchanged.
- The behaviour matches the Rails source cited above, method by method.
