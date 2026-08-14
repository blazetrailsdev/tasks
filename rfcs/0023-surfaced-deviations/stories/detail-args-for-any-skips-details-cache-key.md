---
title: "detailArgsForAny bypasses DetailsKey.detailsCacheKey because the :any variants sentinel has no DetailsMap representation"
status: closed
updated: 2026-08-14
rfc: "0023-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Register move, which CLAUDE.md forbids: this recorded a baseline row's content as a story so the row could be deleted, netting zero convergence while reporting green. The baseline row is restored. Superseded by converge-detail-args-for-any-variants-branch, which changes lookup-context.ts."
---

## Context

`LookupContext#detailArgsForAny` never calls `DetailsKey.detailsCacheKey`,
where Rails ends with `[details, DetailsKey.details_cache_key(details)]`.

Rails, `actionview/lib/action_view/lookup_context.rb:188-205`:

```ruby
def detail_args_for_any
  @detail_args_for_any ||= begin
    details = {}
    LookupContext.registered_details.each do |k|
      if k == :variants
        details[k] = :any
      else
        details[k] = Accessors::DEFAULT_PROCS[k].call
      end
    end
    if @cache
      [details, DetailsKey.details_cache_key(details)]
    else
      [details, nil]
    end
  end
end
```

Trails, `packages/actionview/src/lookup-context.ts`, builds the `Requested`
directly and says why:

```ts
// Rails passes `variants: :any` here; the canonical Requested uses
// a sentinel-array branch ("any") that matches every variant. We
// bypass DetailsKey._detailsKeys for this special form since
// `Requested.variantsIdx === "any"` is not representable in the
// DetailsMap.
const key = this._detailsCache ? new Requested({ ..., variants: "any" }) : null;
```

The blocker is real: `DetailsMap` values are `DetailValue`
(`ReadonlyArray<string | symbol>`), so Ruby's scalar `:any` has no
representation, and `detailsCacheKey` — which memoizes through
`DetailsKey._detailsKeys` — cannot be handed it. The cost is that the
`any?` details tuple is not memoized in the shared `_detailsKeys` map the way
every other lookup's is, so `isAny` builds a fresh `Requested` per call
instead of reusing the canonical one.

This row was previously carried in
`scripts/api-compare/call-mismatches-exclude/actionview/lookup-context.json`.
It was deleted while unblocking PR 6470, because the extractor stopped
reporting it on that branch for reasons unrelated to the code — see
`0025-fidelity-verification-tooling/extractor-missing-set-perturbed-by-unrelated-edits`.
Deleting the row removed the only record of this divergence, so it is
recorded here instead.

## Converged shape

`DetailsMap` (or `DetailsKey.detailsCacheKey`) grows a representation for the
`:any` variants sentinel — a reserved `"any"` marker the `Requested`
constructor already understands (`template-details.ts:32,43`, where
`variantsIdx` is `ReadonlyMap | "any"`) — so `detailArgsForAny` can call
`detailsCacheKey(details)` like Rails and share the memo.

## Acceptance criteria

- `detailArgsForAny` calls `DetailsKey.detailsCacheKey`, matching
  `lookup_context.rb:188-205`.
- The `any?` details tuple is memoized through `DetailsKey._detailsKeys`, so
  repeated `isAny` calls reuse one canonical `Requested`.
- The bypass comment is deleted rather than reworded.
