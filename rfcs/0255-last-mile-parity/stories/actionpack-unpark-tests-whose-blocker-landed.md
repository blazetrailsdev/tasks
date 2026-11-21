---
title: "actionpack: unpark tests whose BLOCKED story is done or closed"
status: draft
updated: 2026-11-21
rfc: "0255-last-mile-parity"
cluster: actionpack
packages: [actionpack]
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

"with routing works with api only controllers", "action methods" and "only
includes one module with route helpers" are skipped `BLOCKED:` on
`api-redirect-to-override-and-head-response-are-invented`,
`action-methods-does-not-subtract-internal-methods` and
`with-routes-helpers-answers-the-wired-class-itself`, each now closed or done.

## Acceptance criteria

- [ ] Each test runs as the Rails body and passes, or its receipt is rewritten to name the real remaining blocker.
- [ ] No actionpack `BLOCKED:` line cites a done or closed story.
- [ ] "[APP] instance variable with same name as engine"
      (`vendor/rails/v8.0.2/actionpack/test/dispatch/prefix_generation_test.rb`):
      if the operator rules that the 2026-10-26 ruling covers it, its skip cites
      that ruling under `PERMANENT-SKIP:`. Otherwise it is ported here.

## Verification

```sh
pnpm parity:test --package actionpack
```
