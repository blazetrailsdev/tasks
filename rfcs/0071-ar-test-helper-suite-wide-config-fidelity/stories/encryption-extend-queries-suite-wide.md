---
title: "Install deterministic-encryption query support suite-wide (helper.rb:104-107, railtie.rb:351)"
status: draft
updated: 2026-07-25
rfc: "0071-ar-test-helper-suite-wide-config-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 250
priority: 50
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/activerecord/test/cases/helper.rb:104-107`:

```ruby
# Simulate .../railtie.rb#L392
ActiveRecord::Encryption.config.extend_queries = true
ActiveRecord::Encryption::ExtendedDeterministicQueries.install_support
ActiveRecord::Encryption::ExtendedDeterministicUniquenessValidator.install_support
```

So Rails' AR suite runs with deterministic-encryption query extension installed
**suite-wide**, standing in for what the railtie does in a real app
(`vendor/rails/activerecord/lib/active_record/railtie.rb:351` —
`if ActiveRecord::Encryption.config.extend_queries`).

trails: `packages/activerecord/src/encryption/config.ts:22` defaults
`extendQueries = false` (and resets to `false` at `:70`), `installSupport`
exists on both classes but is only ever called _inside_ tests (see
`encryption/extended-deterministic-queries.test.ts:507+`), and
`packages/activerecord/src/trailtie.ts` has **no `extendQueries` handling at
all** — grep for `extendQueries` in `trailtie.ts` returns nothing. Found by the
RFC 0064 spike (PR #5309).

Two gaps, one production-side and one test-side; keep them in this order.

## Acceptance criteria

- Port the `railtie.rb:351` arm into `trailtie.ts` so an app that sets
  `extendQueries = true` gets both `installSupport` calls at boot, matching the
  Rails ordering.
- Bootstrap it suite-wide in `packages/activerecord/src/test-setup-ar.ts`
  alongside the existing `helper.rb:99-102` encryption config, with a
  `// Mirror Rails activerecord/test/cases/helper.rb:104-107` comment.
- Verify the per-test `installSupport` calls in
  `encryption/extended-deterministic-queries.test.ts` still behave (idempotency
  under a suite-wide install is the risk).
- Test names match Rails verbatim.
- If the trailtie port plus the suite bootstrap exceeds the 500 LOC ceiling,
  ship the trailtie port and register the bootstrap as a separate story.
