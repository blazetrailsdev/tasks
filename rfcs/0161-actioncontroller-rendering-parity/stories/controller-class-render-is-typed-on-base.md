---
title: "Type the class-level render delegate on Base so Controller.render needs no cast"
status: in-progress
updated: 2026-10-12
rfc: "0161-actioncontroller-rendering-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: trails#8824
claim: "2026-10-12T17:13:59Z"
assignee: "controller-class-render-is-typed-on-base"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by trails PR 8813.

`ActionController::Rendering::ClassMethods` delegates the class-level `render` to the renderer:
`delegate :render, to: :renderer`
(`vendor/rails/v8.0.2/actionpack/lib/action_controller/metal/rendering.rb:14-15`), so
`ApplicationController.render("test/hello_world")` is a typed, public Rails call
(`vendor/rails/v8.0.2/actionpack/test/controller/renderer_test.rb:47-49`).

trails defines it at run time (`packages/actionpack/src/action-controller/metal/rendering.ts`,
`ClassMethods`' `mod.defineMethod("render", ...)`), but `Base` declares only `static renderer` and
`static setupRendererBang` (`packages/actionpack/src/action-controller/base.ts`), so the class method
has no type. The ported test reaches it through a cast:
`(ApplicationController as unknown as Renderer).render("test/hello-world")`
(`packages/actionpack/src/action-controller/controller/renderer.test.ts`, "rendering with a controller class").
The same test file casts `renderer().controller._routes as unknown as RouteSet` in
`withDefaultUrlOptions`, because `Base._routes` is typed `ViewContextRoutes & { defaultEnv() }` and
has no `defaultUrlOptions`.

## Converged shape

`Base` (and `API`, which includes the same module) carries a typed class-level `render` matching
`Renderer#render`, and `_routes` is typed so `defaultUrlOptions` is readable without a cast.

## Acceptance criteria

- [ ] `ApplicationController.render(...)` type-checks with no cast; the cast in `controller/renderer.test.ts` is removed.
- [ ] `withDefaultUrlOptions` in that test reads and writes `_routes.defaultUrlOptions` with no cast.
- [ ] `pnpm parity:api:extra --package actioncontroller` reports no new name on `base.ts` for it (the member is Rails' `render` delegate, credited or receipted, not novel surface).
