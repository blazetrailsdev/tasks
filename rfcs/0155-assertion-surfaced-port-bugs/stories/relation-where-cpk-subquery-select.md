---
title: "relation-where-cpk-subquery-select"
status: ready
updated: 2026-09-22
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced converging `relations_test.rb` assertions (assertions-relations-test, RFC 0132). The converged test is parked `it.skip` in `packages/activerecord/src/relations.test.ts`: **"find all using where with relation with no selects and composite primary key raises"**.

- Rails: activerecord relations_test.rb:949-962; predicate_builder/relation_handler.rb:5-25
- trails: packages/activerecord/src/relation/predicate-builder
- Observed: CpkOrder.where({ id: subquery.select("id") }).toArray() rejects with ActiveRecord::StatementInvalid (SqliteError) where Rails runs it without raising

## Acceptance criteria

- The parked test in `relations.test.ts` is un-skipped (its BLOCKED line removed) and passes with its Rails assertions unchanged.
- The behaviour matches the Rails source cited above, method by method.
