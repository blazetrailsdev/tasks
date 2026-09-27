---
title: "RFC 0139 closing sweep: re-measure every axis, converge Mapping#intern and the invented route-set/index/url-for residue"
status: claimed
updated: 2026-09-27
rfc: "0139-actiondispatch-journey-parity"
cluster: null
packages: ["actionpack"]
deps:
  [
    "mapper-verb-helpers-via-map-method-args",
    "url-for-optimize-routes-generation-never-reaches-route-set-predicate",
    "mapping-requirements-normalize-format-feed-optimize-helper",
    "call-gate-instance-new-call-expects-constructor",
    "route-set-formatter-built-over-self",
    "routing-route-class-has-no-rails-counterpart",
    "port-mapping-initialize-and-make-route",
    "journey-verb-matchers-all-unpaired-by-api-compare",
    "journey-simulator-memos-string-scanner",
    "mapper-scope-is-mapper-scope-not-routing-scope",
    "mapper-concerns-dsl-ports-concerns-not-use-concerns",
    "route-set-url-helper-nesting-config-struct-and-missing-members",
    "route-set-add-route-deprecations-and-default-env-via-full-url-for",
    "route-set-generate-url-helpers-rails-module-shape",
  ]
deps-rfc: []
est-loc: 200
priority: 20
pr: null
claim: "2026-09-27T20:57:25Z"
assignee: "journey-routing-parity-closing-sweep"
blocked-by: null
closed-reason: null
---

## Context

This is the RFC 0139 closing sweep, re-measured by the 2026-09-26 refine. Journey
is at goal except for the rows owned by
`journey-verb-matchers-all-unpaired-by-api-compare` and
`journey-simulator-memos-string-scanner`:

- tests 126/126, with one PERMANENT-SKIP (`normalize path maintains string encoding`,
  which asserts Ruby's String encoding tag)
- actiondispatch assertion mark 357/513/72, at or below the 360/515/74 target
- no `journey/` entry in `arm-throw-mark.json`
- no `journey/` file in `parity:api:extra`

The routing files this RFC took over from RFC 0104 are not at goal. Once
`routing-route-class-has-no-rails-counterpart` (trails#8174) deletes
`routing/route.ts`, `routing/journey-bridge.ts` and `routing/route-helpers.ts`,
the residue that no other story owns is:

- `Mapper::Mapping#intern` (private, `mapper.rb:213`) is unported.
- `routing/route-set.ts` novel members `getNamedRoutes`, `getRoutes`,
  `journeyRouter`, `journeyRecognize` (and `clear`/`recognize`/`serve` moved
  rows). Rails' equivalents are `named_routes`, `routes`/`set`, and
  `recognize_path`/`call` via `@router`.
- `routing/index.ts` novel `generateRouteHelpers` / `initialize` (a trails
  barrel with no Rails counterpart).
- `routing/url-for.ts` novel `initialize` (a module-function port of
  `UrlFor#initialize`).
- `route-set.json`'s `url_for → merge` row, which already carries a specific
  reason. Confirm it still holds.

Rows owned elsewhere, to confirm at sweep time:

- RFC 0141's `mapper-resources-hand-builds-canonical-routes` owns the 14
  `Mapper::Resources::Resource` rows.
- RFC 0141's `mapping-make-route-source-location` owns
  `route_source_locations`, `backtrace_cleaner` and `route_source_location`.

## Acceptance criteria

- Re-run `parity:api`, `parity:api:extra`, `parity:api:calls`,
  `parity:api:calls:args`, `parity:api:arms:throws`, `parity:test`
  and `parity:test:assertions` for actiondispatch against a fresh `pnpm build`,
  and put the journey/ plus routing/{mapper,route_set,url_for} rows in the PR body.
- Every `journey/*.rb` row is 100% on methods, and
  `call-mismatches-exclude/actiondispatch/journey/` is empty.
- The residue above is converged: `Mapping#intern` ported, and the invented
  route-set / index / url-for members folded into their Rails seats or deleted.
- Anything still short of 100% on `routing/mapper.rb` / `routing/route_set.rb`
  is named in the PR body with the story (in any RFC) that owns it. Nothing is
  left unowned.
