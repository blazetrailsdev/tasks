---
title: "Make `fixtures` optional; delete useHandlerTransactionalFixtures"
status: ready
rfc: "draft-ar-test-isolation-helper"
cluster: test-isolation-helper
deps: []
deps-rfc: []
est-loc: 100
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`useHandlerTransactionalFixtures()` is just `useHandlerFixtures` with zero
fixtures — a redundant wrapper that exists only because we lack Ruby's
class-level "declare `fixtures` or not" opt-in. Collapsing the two is the first,
purely-mechanical step toward the end-state goal of a single isolation
helper.

See this RFC §Design "End state — one helper".

## Acceptance criteria

- [ ] `useHandlerFixtures` accepts an omitted/empty `fixtures` argument and
      returns an empty result in that case (no `useFixtures` work done)
- [ ] `useHandlerTransactionalFixtures` is deleted and all call sites rewritten
      to `useHandlerFixtures()`
- [ ] No behavior change: the same `setupHandlerSuite` + transactional rollback
      wiring runs; `usesTransaction` / `invalidateSchemaCache` still forwarded
- [ ] Touched test files green locally

## Notes

`withTransactionalFixtures` (the primitive) is **not** removed — it stays as the
internal implementation `useHandlerFixtures` calls. Only the public
handler-level wrapper goes away.
