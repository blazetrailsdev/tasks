---
title: "relation-blank-present-load-records"
status: done
updated: 2026-09-25
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: trails#8078
claim: "2026-09-25T03:11:52Z"
assignee: "assertions-mysql-legacy-migration-engine-innodb-option"
blocked-by: null
closed-reason: null
---

## Context

Surfaced converging `relations_test.rb` assertions (assertions-relations-test, RFC 0132). The converged test is parked `it.skip` in `packages/activerecord/src/relations.test.ts`: **"presence"**.

- Rails: activerecord/lib/active_record/relation.rb:1274 (blank? is records.blank?, so present? loads the relation)
- trails: packages/activerecord/src/relation.ts:579-587 (isBlank -> isEmpty, isPresent -> isAny)
- Observed: each isPresent() runs SELECT 1 ... LIMIT and never loads, so the second present? and later assert_no_queries blocks run a query

## Acceptance criteria

- The parked test in `relations.test.ts` is un-skipped (its BLOCKED line removed) and passes with its Rails assertions unchanged.
- The behaviour matches the Rails source cited above, method by method.
