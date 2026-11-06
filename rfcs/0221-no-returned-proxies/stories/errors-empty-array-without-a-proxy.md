---
title: "ActiveModel::Errors' EMPTY_ARRAY raises FrozenError without a Proxy"
status: blocked
updated: 2026-11-06
rfc: "0221-no-returned-proxies"
cluster: factory-returned
packages: ["activemodel"]
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: "2026-11-06T16:42:09Z"
assignee: "app-generator-action-methods-method-missing-in-prototype-chain"
blocked-by: "Owner decision: no ruby-compat frozen-native-Array convention exists; without a Proxy, errors.test.ts:500-511/684-695 assert FrozenError on .push and .length=0 of a frozen [], which V8 can only raise as TypeError. Needs a ruling (e.g. FrozenError Symbol.hasInstance over frozen-array TypeError, or a PERMANENT arm)."
---

## Context

trails:

- `packages/activemodel/src/errors.ts:28`

Rails / Ruby:

- `vendor/rails/v8.0.2/activemodel/lib/active_model/errors.rb:265`

Rails is `[].freeze`. The Proxy exists only to raise `FrozenError` instead of JS's `TypeError` on a write; it is handed to every caller reading a missing key's messages. Converge on a frozen array plus ruby-compat's frozen-write convention, whatever that is for a native frozen Array elsewhere in the repo.

See the RFC README for why a returned Proxy is the defect, and trails#9572 for
the first prototype-chain conversion of an instance-level dispatch.

## Acceptance criteria

- [ ] No `new Proxy(` value is returned to a caller from the site(s) above.
- [ ] The behaviour the Proxy provided is kept by the shape named in Context,
      with existing tests passing unchanged.
- [ ] A test pins the behaviour the Proxy existed for (the default, the
      raise, the deferral, the hidden member) on the new shape.
