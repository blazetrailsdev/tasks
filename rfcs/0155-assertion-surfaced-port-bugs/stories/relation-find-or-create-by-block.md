---
title: "relation-find-or-create-by-block"
status: ready
updated: 2026-09-22
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

Surfaced converging `relations_test.rb` assertions (assertions-relations-test, RFC 0132). The converged test is parked `it.skip` in `packages/activerecord/src/relations.test.ts`: **"find or create by with block", "create or find by with block", "find or initialize by with block"**.

- Rails: activerecord/lib/active_record/relation.rb:231,273,302 (find_or_create_by, create_or_find_by, find_or_initialize_by take a block)
- trails: packages/activerecord/src/relation.ts:835-880 (second parameter is an extra attributes hash)
- Observed: the block passed as second argument is ignored, so record.color / record.name stay null

## Acceptance criteria

- The parked test in `relations.test.ts` is un-skipped (its BLOCKED line removed) and passes with its Rails assertions unchanged.
- The behaviour matches the Rails source cited above, method by method.
