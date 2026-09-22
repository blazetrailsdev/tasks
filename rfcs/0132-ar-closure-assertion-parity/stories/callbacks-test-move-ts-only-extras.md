---
title: "Move callbacks.test.ts TS-only extras to callbacks.trails.test.ts"
status: claimed
updated: 2026-09-22
rfc: "0132-ar-closure-assertion-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 300
priority: 7
pr: null
claim: "2026-09-22T17:58:00Z"
assignee: "collection-proxy-extend-super-chain"
blocked-by: null
closed-reason: null
---

## Context

`packages/activesupport/src/callbacks.test.ts` still carries ~81 TS-only tests
(the `Callbacks`, `CallbacksMixin`, async-propagation and CallbackObject
describes, plus duplicate stand-in describes such as
`describe("save conditional person")` and a nested `it` inside
`AfterSaveConditionalPersonCallbackTest`). trails#7953 converged the Rails-named
tests onto Rails' fixtures (`vendor/rails/activesupport/test/callbacks_test.rb:7-345`)
but did not move these.

## Acceptance criteria

- Tests with no `callbacks_test.rb` counterpart move to `callbacks.trails.test.ts`;
  duplicates of Rails-named tests are deleted; the nested `it`-in-`it` is fixed.
- `parity:test` extra count for `callbacks_test.rb` drops to ~0; no Rails-named test renamed.
