---
title: "OptionMerger forwards Object.prototype names, as its undef_method sweep does"
status: draft
updated: 2026-11-07
rfc: "0221-no-returned-proxies"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `OptionMerger` undefines every inherited instance method except `__*`, `instance_eval`, `class` and `object_id` (`vendor/rails/v8.0.2/activesupport/lib/active_support/option_merger.rb:7-9`). So `to_s`, `inspect`, `==` and the like reach `method_missing` and are forwarded to `@context` with the merged options.

After trails#9813, `packages/activesupport/src/option-merger.ts` puts its dispatch Proxy above `OptionMerger.prototype` over `Object.create(Object.getPrototypeOf(OptionMerger.prototype))`. `Object.prototype` members (`toString`, `valueOf`, `hasOwnProperty`, `isPrototypeOf`, `toLocaleString`) are found before the trap, so they answer the merger itself instead of forwarding to the context.

Converged shape: the dispatch layer's target is `Object.create(null)`, so the chain ends below `Object.prototype`. Everything except the merger's own members (`methodMissing`, `respondToMissing`, `constructor`, which is Ruby's `class`) misses into the trap and forwards. Keep the `receiver === OptionMerger.prototype` guard.

## Acceptance criteria

- [ ] `withOptions(ctx, opts, (o) => o.toString())` calls `ctx.toString` through `methodMissing`, as Rails forwards `to_s`.
- [ ] `o instanceof OptionMerger` and `o.constructor === OptionMerger` still hold (Ruby's `class` is kept).
- [ ] The existing `option-merger.test.ts` and `option-merger.trails.test.ts` tests pass unchanged.
