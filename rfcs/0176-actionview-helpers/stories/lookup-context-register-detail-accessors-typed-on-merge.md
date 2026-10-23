---
title: "lookup-context-register-detail-accessors-typed-on-merge"
status: ready
updated: 2026-10-23
rfc: "0176-actionview-helpers"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActionView::LookupContext.register_detail` (`vendor/rails/v8.0.2/actionview/lib/action_view/lookup_context.rb:20-34`) defines `default_<name>` with `Accessors.define_method`, and `<name>` / `<name>=` through `Accessors.module_eval`. The port does the same at run time (`registerDetail` in `packages/actionview/src/lookup-context.ts`), so neither side has literal definitions to score.

As a result, `defaultLocale` / `defaultFormats` are typed at their call sites through a `DefaultAccessors` cast (`lookup-context.ts`, `renderer/template-renderer.ts`, `template/lookup-context.test.ts`) instead of on the merged `Accessors` interface. trails#9227 tried both faithful shapes:

- Interface members with receipts raise actionview's pinned `allowed` dimension (24 → 28).
- Synthesizing the Ruby methods in `scripts/api-compare/extract-ruby-api.rb` alone scores the TS members as missing or declaration-only, because they are `defineProperty`'d at run time. `lookup_context.rb` drops to 39/47.

## Acceptance criteria

- `extract-ruby-api.rb` records `x`, `x=` and `default_x` on `LookupContext::Accessors` for each `register_detail(:x)`.
- The TS extractor credits the matching members declared on the `interface LookupContext extends Accessors` merge as implementations, not declaration-only.
- `defaultLocale` / `defaultFormats` / `defaultVariants` / `defaultHandlers` are declared on `Accessors`, the `DefaultAccessors` casts are removed, and every parity gate stays green without any mark rising.
