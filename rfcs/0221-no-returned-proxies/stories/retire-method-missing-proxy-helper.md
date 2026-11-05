---
title: "Delete ruby-compat's methodMissingProxy once no caller returns it"
status: ready
updated: 2026-11-05
rfc: "0221-no-returned-proxies"
cluster: delegator
packages: ["ruby-compat"]
deps:
  [
    "no-returned-proxy-lint-gate",
    "reflection-proxy-delegates-through-prototype-chain",
    "command-recorder-delegates-through-prototype-chain",
    "uploaded-file-delegates-through-prototype-chain",
    "ruby-compat-delegator-delegates-through-prototype-chain",
  ]
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

trails:

- `packages/ruby-compat/src/method-missing-proxy.ts:164`

Rails / Ruby:

- `vendor/ruby/v3.3.11/vm_eval.c:2570` (`BasicObject#method_missing`; the helper has no Rails counterpart)

Its four callers are this RFC's delegator stories. If a prototype-chain installer generalises across them, it replaces this helper under the same `@noRailsEquivalent PERMANENT` receipt rather than adding a second one.

See the RFC README for why a returned Proxy is the defect, and trails#9572 for
the first prototype-chain conversion of an instance-level dispatch.

## Acceptance criteria

- [ ] `methodMissingProxy` and `method-missing-proxy.ts` are deleted, or
      replaced by a prototype-chain installer that returns nothing.
- [ ] No import of it remains (`git grep methodMissingProxy packages` is empty).
- [ ] `methodMissingProxy` leaves the `no-returned-proxy-lint-gate` rule's helper list.
