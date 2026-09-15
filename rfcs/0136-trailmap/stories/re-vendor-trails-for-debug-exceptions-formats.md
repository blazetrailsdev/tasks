---
title: "Re-vendor trails for DebugExceptions' Rails format split (trails#7777) and decide the loopback API's error format"
status: draft
updated: 2026-09-15
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

blazetrailsdev/trails#7777 makes `DebugExceptions` follow Rails' `render_exception`:

- `request.formats.first` decides `api_request?`;
- only `render_for_api_request` produces JSON/XML;
- everything else gets the HTML page (text for XHR).

The response format now reaches the middleware from `Configuration#debugExceptionResponseFormat`, and `apiOnly=` defaults it to `api`. Before that fix, `DefaultMiddlewareStack` passed the format positionally and it never reached the middleware. See `packages/actionpack/src/action-dispatch/middleware/debug-exceptions.ts` and `packages/trailties/src/application/configuration.ts`.

trailmap's vendored build still has the substring negotiation, so a browser 500 renders as an `<error>` XML document until it re-vendors.

After re-vendoring, trailmap (not api-only) renders the HTML error page for every 500, including on the loopback JSON API (`/stories/*`), whose clients expect JSON.

## Acceptance criteria

- Re-vendor trails at a commit containing #7777, in its own PR (`scripts/vendor-trails.sh`).
- A browser `Accept` on a 500 gets `text/html`.
- Decide and write down what the loopback JSON API returns on a 500, either the HTML debug page or JSON from the API's own rescue. Test that decision.

## Definition of done

`curl -H 'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'` against a failing page on the box answers `text/html`.

## Verification

`pnpm test`, `pnpm gate`.
