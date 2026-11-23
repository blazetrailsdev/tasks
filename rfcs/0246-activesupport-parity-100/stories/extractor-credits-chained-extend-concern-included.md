---
title: "api-compare: credit included blocks on a chained extend(X, Concern).included"
status: done
updated: 2026-11-22
rfc: "0246-activesupport-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: trails#10607
claim: "2026-11-22T22:24:08Z"
assignee: "activesupport-cache-format-version-accessor-property"
blocked-by: null
closed-reason: null
---

## Context

`scripts/api-compare/extract-ts-api.ts` `includedHookOwner` (around :4489) resolves the
owner of an `included` block only when the receiver is a bare identifier
(`X.included(null, fn)`, `Concern.included.call(X, …)`, `X[included] = fn`). The chained
form `extend(Rescuable, Concern).included(null, fn)` reads as Rails'
`extend Concern; included do … end`
(`vendor/rails/v8.0.2/activesupport/lib/active_support/rescuable.rb:12-16`), but its
receiver is a call expression, so its `classAttribute.call` site went uncredited:
`rescuable.rb` scored 9/15. trails#10553 rewrote the port as
`Concern.included.call(Rescuable, …)` to work around this.

## Acceptance criteria

- [ ] `includedHookOwner` unwraps `extend(X, Concern)` to `X` as the receiver of `.included(...)`.
- [ ] Add an extractor test covering the chained form.
- [ ] `packages/activesupport/lib/rescuable.ts` goes back to the chained `extend(Rescuable, Concern).included(...)` and stays at 15/15.
