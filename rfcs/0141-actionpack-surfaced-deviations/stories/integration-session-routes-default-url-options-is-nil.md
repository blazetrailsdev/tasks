---
title: "actionpack: an integration session's routes answer a nil default_url_options, so reverse_merge! tolerates nil"
status: draft
updated: 2026-10-03
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
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

`ActionDispatch::Integration::Session#url_options`
(`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/testing/integration.rb:140-150`) calls
`url_options.reverse_merge!(@app.routes.default_url_options)`, and `default_url_options` is always
a Hash in Rails. In trails `packages/actionpack/src/action-dispatch/testing/integration.ts:110-113`
passes `app.routes.defaultUrlOptions`, which is `undefined` for the app
`packages/trailties/src/boot-app-test-help.trails.test.ts:92` boots and for the session in
"Integration::Runner#integration_session is built by the first name the test misses".

`reverseMerge` / `reverseMergeBang` (`packages/activesupport/src/hash-utils.ts`) tolerate a nil
operand, where Ruby's `reverse_merge` is `other_hash.merge(self)`
(`activesupport/lib/active_support/core_ext/hash/reverse_merge.rb`) and raises `NoMethodError` for
nil. trails PR 8455 sends `merge` to a non-Hash operand but had to keep the nil tolerance, because
sending to nil reds those two tests.

## Acceptance criteria

- [ ] Every `routes` object an integration session can hold answers `defaultUrlOptions` with a hash.
- [ ] `reverseMerge` / `reverseMergeBang` send `merge` to a nil `otherHash`, raising `NoMethodError` as Ruby does, with a `.trails.test.ts` case.
- [ ] `pnpm vitest run packages/actionpack packages/trailties` passes.
