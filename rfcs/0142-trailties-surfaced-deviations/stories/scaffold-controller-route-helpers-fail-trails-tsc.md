---
title: "scaffold-controller-route-helpers-fail-trails-tsc"
status: in-progress
updated: 2026-09-30
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 1
pr: trails#8260
claim: "2026-09-30T02:49:48Z"
assignee: "scaffold-controller-route-helpers-fail-trails-tsc"
blocked-by: null
closed-reason: null
---

## Context

After #8253 the scaffold controller's redirects go through the named route
helpers, as Rails' `controller.rb.tt` does (`redirect_to posts_path, ...`).
A fresh app's `pnpm build` (`trails-tsc --schema db/schema.ts`) now fails:

```text
app/controllers/posts-controller.ts(45,26): error TS2339: Property 'postsPath' does not exist on type 'PostsController'.
```

The helpers exist at run time (the destroy redirect works under
`trails server`), but nothing types them on the controller. Rails mixes
`Rails.application.routes.url_helpers` into controllers
(`actionpack/lib/action_dispatch/routing/route_set.rb`, `UrlFor` / the
`url_helpers` module), and every named route becomes a method.

Found re-running the root README quickstart (PR #8195) on `main` at `329f709afd`.
The previous build break, `scaffold-controller-fails-trails-tsc-on-a-fresh-app`
(#8250), was about `postParams()`. This is the next one.

## Acceptance criteria

- [ ] `trails new` + `generate scaffold` + `pnpm build` exits 0.
- [ ] The route helpers are typed from the app's routes, whether generated from
      `config/routes.ts` or declared by the generator, without an `any` cast in
      the emitted controller.
