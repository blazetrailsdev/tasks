---
title: "actionview: converge the asset-tag-helper stringify_keys call-args baseline rows"
status: in-progress
updated: 2026-10-16
rfc: "0176-actionview-helpers"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: trails#8978
claim: "2026-10-16T14:15:06Z"
assignee: "call-gate-credits-map-with-index-as-the-indexed-callback"
blocked-by: null
closed-reason: null
---

## Context

trails#8953 added two `kind: "args"` rows to `scripts/api-compare/call-mismatches-exclude/actionview/helpers/asset-tag-helper.json`. They cover `javascript_include_tag` and `stylesheet_link_tag`, which call `stringify_keys` with no arguments on the result of `sources.extract_options!` (vendor/rails/v8.0.2/actionview/lib/action_view/helpers/asset_tag_helper.rb:114,203). The port writes `stringifyKeys(extractOptionsBang(sources))` (packages/actionview/src/helpers/asset-tag-helper.ts:77,139).

`alignBuiltinReceiver` (scripts/api-compare/call-args.ts) strips the receiver only for names in `RECEIVER_AS_FIRST_ARG` or exports in `RECEIVER_KEYED_RUBY_COMPAT_EXPORTS`. `stringify_keys` is in neither: `HashWithIndifferentAccess` also defines it, which bars it from the name table.

## Acceptance criteria

- [ ] The comparer aligns `stringifyKeys(x)` with Ruby `x.stringify_keys` when the TS callee is the `@blazetrails/activesupport` `stringifyKeys` export, aligned by callee as `MODULE_MIXIN_EXPORTS` already is. Alternatively, the port takes a shape the comparer already credits.
- [ ] Both rows are deleted from `asset-tag-helper.json`, and `pnpm parity:api:calls:args` passes.
