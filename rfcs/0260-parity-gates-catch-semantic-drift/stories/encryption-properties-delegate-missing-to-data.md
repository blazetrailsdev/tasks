---
title: "Encryption::Properties delegates missing methods to data via delegateMissingTo"
status: draft
updated: 2026-11-28
rfc: "0260-parity-gates-catch-semantic-drift"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.5.2/activerecord/lib/active_record/encryption/properties.rb:19-20`
declares `delegate_missing_to :data` and `delegate :==, :[], :each, :key?, to: :data`
over an `attr_reader :data` Hash. `packages/activerecord/lib/encryption/properties.ts:23`
holds a private `_data` Map with hand-written `get` / `set` / `each` / `equals`
and no `delegateMissingTo` call, so the Ruby manifest's new
`respond_to_missing?` / `method_missing` rows (trails#10874) are uncredited.

## Acceptance criteria

- [ ] `Properties` exposes `data` as Rails does and calls `delegateMissingTo.call(Properties, "data")`.
- [ ] `delegate :==, :[], :each, :key?, to: :data` is a `delegate.call` over `data`, replacing the hand-written forwarders.
- [ ] `properties.test.ts` stays green.
