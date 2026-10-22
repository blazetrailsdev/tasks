---
title: "parity-credits-register-detail-generated-accessors"
status: draft
updated: 2026-10-22
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

`ActionView::LookupContext.register_detail` (`vendor/rails/v8.0.2/actionview/lib/action_view/lookup_context.rb:20-34`) defines `default_<name>` with `Accessors.define_method` and the reader/writer pair through `Accessors.module_eval`. `parity:api` reads only literal `def`s from `rails-api.json`, so the ported `defaultLocale` / `defaultFormats` / `defaultVariants` / `defaultHandlers` on `LookupContext`'s merged `Accessors` interface (`packages/actionview/src/lookup-context.ts`) count as extra surface (moved: `default_formats` is also defined in `base.rb`). They carry `@noRailsEquivalent CONVERGEABLE` receipts pointing here.

## Acceptance criteria

- The Ruby extractor records the methods `register_detail` generates for each `register_detail(:x)` call in `lookup_context.rb:51-59` (`x`, `x=`, `default_x`) as `LookupContext::Accessors` methods.
- The four `@noRailsEquivalent CONVERGEABLE` receipts on `Accessors` are removed and `parity:api:extra:gate` stays green.
