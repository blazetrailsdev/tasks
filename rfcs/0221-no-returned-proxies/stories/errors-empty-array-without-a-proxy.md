---
title: "ActiveModel::Errors' EMPTY_ARRAY raises FrozenError without a Proxy"
status: ready
updated: 2026-11-05
rfc: "0221-no-returned-proxies"
cluster: factory-returned
packages: ["activemodel"]
deps: []
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
