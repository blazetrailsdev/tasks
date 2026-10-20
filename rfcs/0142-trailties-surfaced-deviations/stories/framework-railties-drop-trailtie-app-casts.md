---
title: "framework-railties-drop-trailtie-app-casts"
status: closed
updated: 2026-10-20
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Shipped in trails#9117"
---

## Context

trails#9117 typed `InitializerBlock`'s first argument as `Application`
(`run_initializers(group, self)`, `vendor/rails/v8.0.2/railties/lib/rails/application.rb:440`).
The framework railties in `packages/trailties/src/trailties/` still declare a local
`interface TrailtieApp` and cast `(app as TrailtieApp)` inside initializer blocks
(`action-view.ts:50`, `action-dispatch.ts:59`, `action-controller.ts:53`, `global-id.ts`),
and read namespaces with `config.get("actionView") as ActionViewConfig` instead of the
augmented `config.actionView` (`action-view.ts:73`). Rails reads `app.config.action_view`
directly (`vendor/rails/v8.0.2/actionview/lib/action_view/railtie.rb`).

## Acceptance criteria

- Initializer blocks in `packages/trailties/src/trailties/*.ts` take the typed `app` with no `TrailtieApp` cast; the local `TrailtieApp` interfaces are deleted where `Application` already answers the members.
- Config namespace reads use the `Configuration` augmentation (`app.config.actionView`) instead of `config.get(...) as X`.
- Tests that pass a fake app object keep compiling (cast at the test call site only).
