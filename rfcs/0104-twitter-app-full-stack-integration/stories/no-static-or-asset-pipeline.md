---
title: "No static file serving or asset pipeline: a generated app's stylesheet 404s"
status: in-progress
updated: 2026-08-31
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: ["actionpack", "trailties"]
deps: ["splice-finisher-initializers"]
deps-rfc: []
est-loc: null
priority: 15
pr: 7295
claim: "2026-08-31T14:16:57Z"
assignee: "cli-cannot-load-typescript-app-code"
blocked-by: null
closed-reason: null
---

## Context

Nothing in a trails app's request path serves static files, so the stylesheet
the generated layout links 404s on a freshly generated app.

Two missing pieces:

1. **`ActionDispatch::Static` is never mounted.** The middleware is fully
   ported (`packages/actionpack/src/action-dispatch/middleware/static.ts`,
   `Static` + `FileHandler`) and `DefaultMiddlewareStack.buildStack`
   (`packages/trailties/src/application/default-middleware-stack.ts:57-66`)
   mounts it under `config.publicFileServer.enabled` — but that stack is
   never built, because `Application#initializers` does not splice `Finisher`
   (see the sibling story `splice-finisher-initializers`), and the class that
   actually serves requests (`trailties/src/server/application.ts`) runs no
   middleware at all: `call(env)` goes straight to `this.routeSet.call(env)`.

   Rails: `vendor/rails/railties/lib/rails/application/default_middleware_stack.rb:64`,
   `middleware.use ::ActionDispatch::Static, paths["public"].first, ...`.

2. **There is no asset pipeline.** `trails new` emits
   `src/app/assets/stylesheets/application.css` and a layout linking
   `/assets/stylesheets/application.css`
   (`packages/trailties/src/generators/app-generator.ts`), which is the path
   Propshaft serves `app/assets` under. Nothing in trails maps that prefix, so
   even with `Static` mounted on `public/` the link is dead.

A third, smaller bug falls out of fixing the first: the generator also emits
`public/index.html`, which `Static` serves at `/` and which therefore shadows
the app's root route. Rails ships no `public/index.html` — a new app's
welcome page is a route to `Rails::WelcomeController`, and trailties already
has that controller and its template
(`packages/trailties/src/templates/rails/welcome/index.tse`).

`examples/twitter-app` works around all three: it mounts `Static` itself in
`src/server.ts#withStaticFiles`, links `/stylesheets/application.css` rather
than `/assets/...`, and deletes `public/index.html`.

## Acceptance criteria

- `ActionDispatch::Static` is in the request path of a booted app, serving
  `public/`, mounted from the default middleware stack rather than by the app.
- `app/assets` is served under `/assets`, or the generator stops emitting a
  layout that links a path nothing serves.
- `trails new` does not emit a `public/index.html` that shadows the root
  route; the welcome page is a route to `WelcomeController`.
- `examples/twitter-app` drops `withStaticFiles` and its `TODO`, and its
  layout goes back to the generator's `/assets/...` href.
