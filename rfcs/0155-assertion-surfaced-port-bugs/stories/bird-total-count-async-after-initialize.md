---
title: "bird-total-count-async-after-initialize"
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

Surfaced converging `relations_test.rb` assertions (assertions-relations-test, RFC 0132). The converged test is parked `it.skip` in `packages/activerecord/src/relations.test.ts`: **"first or initialize with block"**.

- Rails: activerecord/test/models/bird.rb (after_initialize sets total_count from Bird.count when enable_count)
- trails: packages/activerecord/src/test-helpers/models/bird.ts:30-36 (void Bird.count().then(...))
- Observed: totalCount is assigned from an unawaited promise, so it is still 0 when the test reads it; Rails sets it synchronously

## Acceptance criteria

- The parked test in `relations.test.ts` is un-skipped (its BLOCKED line removed) and passes with its Rails assertions unchanged.
- The behaviour matches the Rails source cited above, method by method.
