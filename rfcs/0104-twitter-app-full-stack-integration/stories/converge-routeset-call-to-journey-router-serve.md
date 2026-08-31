---
title: "Converge RouteSet#call onto Journey::Router#serve"
status: draft
updated: 2026-08-31
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActionDispatch::Routing::RouteSet#call` is four lines
(`vendor/rails/actionpack/lib/action_dispatch/routing/route_set.rb:905-909`):

```ruby
def call(env)
  req = make_request(env)
  req.path_info = Journey::Router::Utils.normalize_path(req.path_info)
  @router.serve(req)
end
```

Everything else — matching, `path_parameters`, `SCRIPT_NAME`/`PATH_INFO`
rewriting for unanchored routes, the `X-Cascade: pass` fall-through — lives in
`Journey::Router#serve` (`journey/router.rb:32-64`), and each route's endpoint
(`Dispatcher`, `Redirect`, `Constraints`, a mounted app) is what `Mapper#app`
attached (`routing/mapper.rb:294-303`).

trails' `RouteSet#call`
(`packages/actionpack/src/action-dispatch/routing/route-set.ts`) is **80 lines**
and re-implements all of it beside Journey rather than through it:

- calls `this.recognize(method, path)` itself instead of `@router.serve`;
- dispatches `route.redirectEndpoint` inline, lowercasing headers by hand;
- forwards mounted Rack apps inline, rewriting `SCRIPT_NAME` / `PATH_INFO` and
  merging `path_parameters` — duplicating `journey/router.rb:51-67`, which the
  in-file comment already acknowledges it is mirroring;
- merges `action_dispatch.request.path_parameters` into `env` by hand;
- only then reaches `Dispatcher#serve`.

`Journey::Router#serve` is ported and does the same work
(`packages/actionpack/src/action-dispatch/journey/router.ts`), so the duplicate
is live, not a stub. PR #7286 routed the final step through `Dispatcher` and
deleted the invented default-JSON response, but left the surrounding 80 lines
in place — it was scoped to the dispatcher seam.

Evidence the divergence is already measured: `call` carries a
`call → normalize_path` row in
`scripts/api-compare/call-mismatches-exclude/actiondispatch/routing/route-set.json`
— Rails' `normalize_path` call is one of the three lines trails does not make.

## Converged shape

- `RouteSet#call` becomes `make_request(env)` → `normalize_path` on
  `path_info` → `this.journeyRouter.serve(req)`, matching `route_set.rb:905-909`
  line for line (async, since `Router#serve` is async in trails — the settled
  idiom, already in place).
- Redirect routes carry their `Redirect` endpoint as the Journey route's `app`
  (`mapper.rb:294-303`), so `Router#serve` dispatches them; the inline
  `redirectEndpoint` branch in `call` is deleted.
- Mounted Rack apps likewise become the route's `app`, so the
  `SCRIPT_NAME`/`PATH_INFO` rewriting in `call` is deleted in favour of
  `Router#serve`'s (`journey/router.rb:51-58`), which already implements the
  `unless route.path.anchored` guard.
- `path_parameters` is set by `Router#serve` (`journey/router.rb:59-67`), not by
  `call`.
- The `call → normalize_path` baseline row is REMOVED, not reworded.

## Notes

`buildJourneyRouter` (`routing/journey-bridge.ts`) currently attaches one shared
app to every route and falls back to a throwing stub whose message says
"use RouteSet.call(), not journeyRouter.serve()" — that stub is the marker of
this divergence and goes away with it. Sequence after
`build-a-dispatcher-per-route-with-raise-on-name-error`, which already has to
make the bridge attach a per-route app.
