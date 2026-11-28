---
title: "Ruby manifest records delegate_missing_to's generated method_missing / respond_to_missing?"
status: claimed
updated: 2026-11-28
rfc: "0260-parity-gates-catch-semantic-drift"
cluster: parity-gates
packages: [scripts, activestorage]
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: "2026-11-28T16:49:52Z"
assignee: "delegate-missing-to-in-ruby-manifest"
blocked-by: null
closed-reason: null
---

## Context

RFC Design §2. `extract-ruby-api.rb#process_delegate` skips
`delegate_missing_to` (`scripts/api-compare/extract-ruby-api.rb:2240`), so
`Attached::One` (`vendor/rails/v8.0.5.2/activestorage/lib/active_storage/attached/one.rb:27`)
has no `respond_to_missing?` row. Its port hand-rolls a `method_missing` Proxy
(`packages/activestorage/lib/attached/one.ts`), and trails#10792 added the
`respondToMissing` half by hand. `Delegation.generateMethodMissing`
(`packages/activesupport/lib/delegation.ts`) already defines both.

## Acceptance criteria

- [ ] `delegate_missing_to :x` records `method_missing` and `respond_to_missing?` on the owner in the Ruby manifest.
- [ ] A TS `delegateMissingTo` call credits both in `parity:api`.
- [ ] `Attached::One` calls `delegateMissingTo("attachment", { allowNil: true })` in place of its Proxy and hand-written `respondToMissing`, with its existing tests green.
- [ ] Every other `delegate_missing_to` site the manifest now lists is either credited or baselined only where it predates this story.
