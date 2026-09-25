---
title: "relation-first-or-create-block"
status: in-progress
updated: 2026-09-25
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: trails#8085
claim: "2026-09-25T14:11:37Z"
assignee: "time-subsec-drops-subnano-residual"
blocked-by: null
closed-reason: null
---

## Context

Surfaced converging `relations_test.rb` assertions (assertions-relations-test, RFC 0132). The converged test is parked `it.skip` in `packages/activerecord/src/relations.test.ts`: **"first or create with block", "first or create bang with valid block"**.

- Rails: activerecord/lib/active_record/relation.rb:178-186 (first_or_create / first_or_create! take a block)
- trails: packages/activerecord/src/relation.ts:926-937
- Observed: firstOrCreate / firstOrCreateBang take only an attributes hash; the block is never run

## Acceptance criteria

- The parked test in `relations.test.ts` is un-skipped (its BLOCKED line removed) and passes with its Rails assertions unchanged.
- The behaviour matches the Rails source cited above, method by method.
