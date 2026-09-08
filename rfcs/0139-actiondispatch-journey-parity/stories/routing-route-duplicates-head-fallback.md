---
title: "Routing::Route#match duplicates match_head_routes' HEAD fallback"
status: draft
updated: 2026-09-08
rfc: "0139-actiondispatch-journey-parity"
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

Rails resolves a HEAD request against GET routes in ONE place: the router's
`match_head_routes`
(`vendor/rails/actionpack/lib/action_dispatch/journey/router.rb:137-148`),
which first prefers routes that `requires_matching_verb?` and only then
re-runs the match with `req.request_method = "GET"`. `Journey::Route#matches?`
and its private `match_verb` (`journey/route.rb:183-185`) know nothing about
HEAD — `match_verb` is exactly
`@request_method_match.any? { |m| m.call request }`.

trails has that port already: `Router#matchHeadRoutes`
(`packages/actionpack/src/action-dispatch/journey/router.ts:151-174`).

But `ActionDispatch::Routing::Route#match`
(`packages/actionpack/src/action-dispatch/routing/route.ts`) carries a SECOND,
cruder copy of the same rule at its own verb guard:

```ts
if (!this.matchVerb(m) && !(m === "HEAD" && this.matchVerb("GET"))) {
  return null;
}
```

Rails has no such arm on a route. The fallback is unconditional here — it has
no `requires_matching_verb?` preference — so a HEAD request can match a GET
route even where Rails would first have found a route that answers HEAD
directly.

Predates PR #7632, which only relocated the arm out of `matchVerb` (so that
method mirrors `match_verb` exactly) and left it at the call site.

## Converged shape

`Route#match`'s guard is `if (!this.matchVerb(m)) return null;` — the JS
spelling of `matches?`'s verb half — and every HEAD request reaches GET routes
through `Router#matchHeadRoutes`, the single Rails site for it. Check what
`Route#match`'s callers do for HEAD before deleting the arm: if a caller
bypasses the journey router entirely, route it through
`matchHeadRoutes` rather than reinstating a per-route fallback.

## Acceptance criteria

- [ ] `Route#match` has no HEAD-specific arm; its verb guard is `matchVerb`
      alone, matching `journey/route.rb:183-185`.
- [ ] A HEAD request still reaches a GET-only route, via
      `Router#matchHeadRoutes` (`journey/router.rb:137-148`).
- [ ] A HEAD request prefers a route that answers HEAD directly over a GET
      route, as `match_head_routes`'s first `select` does — pinned by a test.
- [ ] `pnpm parity:test --package actiondispatch` and the assertion ratchet do
      not regress.
