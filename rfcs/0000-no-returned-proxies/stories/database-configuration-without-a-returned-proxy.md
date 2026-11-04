---
title: "databaseConfiguration answers a missing env with `shared` without a Proxy"
status: draft
updated: 2026-11-04
rfc: "0000-no-returned-proxies"
cluster: factory-returned
packages: ["trailties"]
deps: ["no-returned-proxy-lint-gate"]
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

- `packages/trailties/src/database.ts:135`

Rails / Ruby:

- `vendor/rails/v8.0.2/railties/lib/rails/application/configuration.rb:457`

Rails is `Hash.new(shared).merge(loaded_yaml)`: a Hash default, not dispatch. ruby-compat's `Hash` carries a default (packages/ruby-compat/README.md, "When a Ruby Hash is a Hash"), so this converges onto a `Hash` with `default = shared`, not onto the prototype chain.

See the RFC README for why a returned Proxy is the defect, and trails#9572 for
the first prototype-chain conversion of an instance-level dispatch.

## Acceptance criteria

- [ ] No `new Proxy(` value is returned to a caller from the site(s) above.
- [ ] The behaviour the Proxy provided is kept by the shape named in Context,
      with existing tests passing unchanged.
- [ ] A test pins the behaviour the Proxy existed for (the default, the
      raise, the deferral, the hidden member) on the new shape.
- [ ] This site's row in the `no-returned-proxy-lint-gate` list is deleted.
