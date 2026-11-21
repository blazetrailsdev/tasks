---
title: "activesupport: NullStore prepends Strategy::LocalCache"
status: draft
updated: 2026-11-20
rfc: "0246-activesupport-parity-100"
cluster: test-residuals
packages: [activesupport]
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/activesupport/lib/active_support/cache/null_store.rb:15`
is `prepend Strategy::LocalCache`. NullStore's "local store strategy" and
"local store repeated reads" were parked under
`port-cache-strategy-local-cache`, closed on the false premise that only
MemCache/Redis use it. trails has `cache/strategy/local-cache.ts`.

## Acceptance criteria

- [ ] `NullStore` prepends `LocalCache` as Rails does.
- [ ] Both tests run as the Rails bodies and pass.
