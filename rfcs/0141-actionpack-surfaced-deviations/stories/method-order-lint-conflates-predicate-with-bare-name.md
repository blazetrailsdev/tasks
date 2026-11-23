---
title: "method-order-lint-conflates-predicate-with-bare-name"
status: in-progress
updated: 2026-11-23
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#10671
claim: "2026-11-23T22:01:08Z"
assignee: "method-order-lint-conflates-predicate-with-bare-name"
blocked-by: null
closed-reason: null
---

## Context

`blazetrails/rails-file-structure-method-order` reorders
`packages/actioncable/lib/channel/base.ts` so `unsubscribed()` precedes
`subscribed()`. Rails declares `unsubscribed?` at
`vendor/rails/v8.0.5.2/actioncable/lib/action_cable/channel/base.rb:210`,
`subscribed` at `:218` and `unsubscribed` at `:224`. The ordering manifest
(`eslint/rails-file-structure-method-order.json`) appears to key the predicate
`unsubscribed?` and the method `unsubscribed` to the same TS name, so the
predicate's position wins and the autofix moves `unsubscribed` above
`subscribed` on every commit (seen on trails#10671).

## Acceptance criteria

- [ ] The manifest keys a Ruby predicate `foo?` to its TS spelling `isFoo`, never to `foo`.
- [ ] `channel/base.ts` holds `subscribed` before `unsubscribed`, and the autofix leaves it there.
