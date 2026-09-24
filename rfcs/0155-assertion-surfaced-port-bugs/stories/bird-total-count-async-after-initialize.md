---
title: "bird-total-count-async-after-initialize"
status: blocked
updated: 2026-09-24
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: "2026-09-24T18:14:09Z"
assignee: "attribute-assignment-argument-error-names-js-number-not-integer"
blocked-by: "Rails bird.rb:22-24 runs Bird.count inside after_initialize; trails runs the initialize chain strict-sync from the constructor (core.ts:676, base.ts:1727/1828, runCallbacks strict:'sync') and Relation#count is an awaited query, so no synchronous count exists to assign total_count before firstOrInitialize returns. Needs an awaitable new/initialize path (RFC 0087 one-surface-always-awaited), not a model-side fix."
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
