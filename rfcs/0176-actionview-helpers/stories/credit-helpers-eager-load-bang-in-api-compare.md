---
title: "Credit ActionView::Helpers.eager_load! in api-compare (helpers.rb 306/306)"
status: done
updated: 2026-10-27
rfc: "0176-actionview-helpers"
cluster: null
packages: ["actionview"]
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: trails#9358
claim: "2026-10-27T01:18:07Z"
assignee: "credit-helpers-eager-load-bang-in-api-compare"
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:api --package actionview` on origin/main (7a1140c7b2) reports
`helpers.rb` at 305/306: `ActionView::Helpers.eager_load!` (`helpers.rb`) is
missing. The method exists — `packages/actionview/src/helpers.ts:51` installs
`eagerLoadBang` with `Object.defineProperty(Helpers, "eagerLoadBang", …)` — but
the TS extractor does not see a property installed that way, so the row stays
uncredited.

## Acceptance

- Define `eagerLoadBang` on `Helpers` in a shape the api-compare extractor
  credits (e.g. a plain assignment / object member, matching how sibling
  modules' `eager_load!` ports are written), keeping its body
  (`Autoload.eagerLoadBang` then `Tags.eagerLoadBang`).
- `pnpm parity:api --package actionview` shows `helpers.rb` 306/306.
