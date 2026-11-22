---
title: "activesupport: NullStore prepends Strategy::LocalCache"
status: in-progress
updated: 2026-11-22
rfc: "0246-activesupport-parity-100"
cluster: test-residuals
packages: [activesupport]
deps: []
deps-rfc: []
est-loc: 80
priority: 1
pr: trails#10554
claim: "2026-11-22T03:09:35Z"
assignee: "flip-the-rails-ref-to-v8-0-5-1"
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
