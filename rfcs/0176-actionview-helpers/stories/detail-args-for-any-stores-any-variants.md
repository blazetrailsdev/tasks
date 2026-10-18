---
title: "detailArgsForAny stores the :any variants sentinel and keys through DetailsKey.detailsCacheKey"
status: done
updated: 2026-10-17
rfc: "0176-actionview-helpers"
cluster: null
packages: ["actionview"]
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: trails#9014
claim: "2026-10-17T23:18:51Z"
assignee: "detail-args-for-any-stores-any-variants"
blocked-by: null
closed-reason: null
---

## Context

`ActionView::LookupContext#detail_args_for_any`
(`vendor/rails/v8.0.2/actionview/lib/action_view/lookup_context.rb:188-206`) stores
`details[:variants] = :any` and every other registered detail from
`Accessors::DEFAULT_PROCS[k].call`, then keys the hash with
`DetailsKey.details_cache_key(details)` when `@cache` is set.

`detailArgsForAny` (`packages/actionview/src/lookup-context.ts`) leaves `variants` at its
default and builds `new Requested({ ..., variants: "any" })` directly, so it calls neither
`.call` nor `detailsCacheKey`. Two call-mismatch rows in
`scripts/api-compare/call-mismatches-exclude/actionview/lookup-context.json` record it.

Tried in trails PR for `converge-call-rows-surfaced-by-same-file-mixin-owner`: widening
`DetailValue` (`lookup-context.ts:21`) to admit `"any"` fails typecheck in
`DetailsKey.detailsCacheKey` (`formats.filter`, the `Requested` fields), in the
`.map` at `:130`, and at every `PathSet#find*`/`exists` call taking a `DetailsMap` as
`LookupDetails` (`:309`, `:331`, `:343`). `Requested` and the resolver must learn `:any`
for `variants` first.

## Acceptance criteria

- `detailArgsForAny` mirrors `lookup_context.rb:188-206`: the `variants` arm stores the
  `:any` sentinel, the other arm calls `DEFAULT_PROCS[k].call`, and the key comes from
  `DetailsKey.detailsCacheKey(details)`.
- `DetailsKey.detailsCacheKey`, `Requested` and the resolver accept `variants: "any"`.
- Both `detail_args_for_any` rows are deleted from the call-mismatch baseline and
  `pnpm parity:api:calls` is green with the mark tightened.
