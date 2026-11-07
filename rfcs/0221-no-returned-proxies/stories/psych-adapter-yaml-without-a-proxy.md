---
title: "ruby-compat's lazy `yaml` backend is resolved without a Proxy"
status: done
updated: 2026-11-07
rfc: "0221-no-returned-proxies"
cluster: factory-returned
packages: ["ruby-compat"]
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: trails#9813
claim: "2026-11-07T00:17:05Z"
assignee: "delegate-missing-to-in-prototype-chain"
blocked-by: null
---

## Context

trails:

- `packages/ruby-compat/src/psych-adapter.ts:109`

Rails / Ruby:

- `vendor/ruby/v3.3.11/ext/psych/lib/psych.rb:13` (`require 'psych.so'`)

The exported `yaml` constant is a Proxy that resolves the backend on first member read. Lazy getters on a plain object, or an explicit resolve at the call sites, give the same deferral with no Proxy.

See the RFC README for why a returned Proxy is the defect, and trails#9572 for
the first prototype-chain conversion of an instance-level dispatch.

## Acceptance criteria

- [ ] No `new Proxy(` value is returned to a caller from the site(s) above.
- [ ] The behaviour the Proxy provided is kept by the shape named in Context,
      with existing tests passing unchanged.
- [ ] A test pins the behaviour the Proxy existed for (the default, the
      raise, the deferral, the hidden member) on the new shape.
