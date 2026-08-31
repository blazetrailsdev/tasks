---
title: "include-view-paths-in-action-controller-base"
status: claimed
updated: 2026-08-31
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 16
pr: null
claim: "2026-08-31T21:45:19Z"
assignee: "session-and-flash-lifecycle"
blocked-by: null
closed-reason: null
---

## Context

`ActionController::Base` does not include `ActionView::ViewPaths`, so the
class-level `prependViewPath` / `viewPaths` / `_viewPaths` readers Rails
inherits through `AbstractController::Base` are absent, and the renderer
reads a bespoke `static lookupContext?` slot instead.

- `packages/actionpack/src/action-controller/base.ts:177` — `static
lookupContext?: LookupContext`, read at
  `base.ts:291` inside `renderAsync`.
- `packages/actionview/src/view-paths.ts:61-79` — `ClassMethods.appendViewPath`
  / `prependViewPath` / `viewPaths` already exist and are ready to be mixed
  onto a host class via the `this`-typed-function idiom.
- Rails: `ActionView::ViewPaths` is included into
  `AbstractController::Base` (`actionview/lib/action_view/view_paths.rb`,
  `abstractcontroller/lib/abstract_controller/rendering.rb`), which is why
  `engine.rb:614`'s `add_view_paths` can call
  `prepend_view_path(views) if respond_to?(:prepend_view_path)` and have the
  guard be true.

Because the guard is currently false in trails, `Engine`'s ported
`add_view_paths` initializer
(`packages/trailties/src/engine.ts`, added in PR #6517) takes the fallback
arm and assigns a freshly built `LookupContext` to the `lookupContext` slot
instead of prepending. That is a documented deviation, not a design.

## Acceptance criteria

- `ActionController::Base` responds to `prependViewPath` / `appendViewPath` /
  `viewPaths` with the `ActionView::ViewPaths` semantics (per-class path set
  via `PathRegistry`, inherited from the superclass).
- `renderAsync`'s lookup context derives from `_viewPaths` rather than a
  hand-assigned `lookupContext` slot.
- `Engine`'s `add_view_paths` initializer takes Rails' true arm — the
  `else` branch and its explanatory comment are deleted from
  `packages/trailties/src/engine.ts`.
- The boot fixture at `packages/trailties/src/__fixtures__/boot-app/` renders
  `app/views/posts/index.html.raw` through the prepended path.
