---
title: "relations-extract-associated"
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

Surfaced converging `relations_test.rb` assertions (assertions-relations-test, RFC 0132). The converged test is parked `it.skip` in `packages/activerecord/src/relations.test.ts`: **"extracted association"**.

- Rails: activerecord/lib/active_record/relation/query_methods.rb:341 (extract_associated)
- trails: packages/activerecord/src/relation/query-methods.ts:283-286
- Observed: extractAssociated calls `record[association]()` but association readers are properties, so it raises TypeError

## Acceptance criteria

- The parked test in `relations.test.ts` is un-skipped (its BLOCKED line removed) and passes with its Rails assertions unchanged.
- The behaviour matches the Rails source cited above, method by method.
