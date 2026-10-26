---
title: "The API extractor reads defineModule's inline methods; CollectionHelpers and RoutesHelpers go through defineModule"
status: claimed
updated: 2026-10-26
rfc: "0176-actionview-helpers"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: "2026-10-26T15:34:09Z"
assignee: "define-module-inline-methods-reach-the-api-extractor"
blocked-by: null
closed-reason: null
---

## Context

`plain-object-modules-carry-a-module-marker` (trails#9328) wraps object-literal modules in `defineModule` so `include` / `rbEqual` see them as modules before anything includes them. Two modules could not be converted in that PR:

- `Tags::CollectionHelpers`, `packages/actionview/src/helpers/tags/collection-helpers.ts:120` (Rails `actionview/lib/action_view/helpers/tags/collection_helpers.rb`)
- `AbstractController::Railties::RoutesHelpers`, `packages/actionpack/src/abstract-controller/trailties/routes-helpers.ts:26` (Rails `actionpack/lib/abstract_controller/railties/routes_helpers.rb`)

Both define their methods inline in the literal. The exported-module branch of `scripts/api-compare/extract-ts-api.ts` (around line 1016) harvests only accessors from a `defineModule({...})` argument (`o.properties.filter(ts.isAccessor)`), and expects other members to be same-file top-level functions referenced by shorthand. With the wrap, the inline methods drop out of the measured surface, and the Rails API/Test Comparison job reds on 5 stale body pins in `scripts/api-compare/body-pins.json`:

- `railties/routes_helpers.rb:with`
- `tags/collection_helpers.rb`: `default_html_options_for_collection`, `hidden_field`, `instantiate_builder`, `sanitize_attribute_name`

## Acceptance criteria

- The extractor harvests inline method declarations (and function-valued property assignments) from a `defineModule({...})` argument, as it does from a bare `export const X = {...}`, including through an `as {...}` cast.
- `CollectionHelpers` and `RoutesHelpers` are `defineModule({...})`, and every body pin above still matches.
- No other package's `parity:api` / extra-surface numbers move unexpectedly; if they do, the moved names are justified in the PR.
