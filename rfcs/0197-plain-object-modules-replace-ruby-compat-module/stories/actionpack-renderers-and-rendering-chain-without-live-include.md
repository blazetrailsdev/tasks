---
title: "actionpack Renderers and the render_to_body chain become plain modules (Renderers.add live include)"
status: draft
updated: 2026-10-27
rfc: "0197-plain-object-modules-replace-ruby-compat-module"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Follow-up to `actionpack-module-super-inlined-into-includers` (trails#9359). That PR converted the controller `super` chain to plain-object modules, working backwards from the end of `Base::MODULES`. It stopped at `renderToBody`, because a plain module's copied methods outrank every carrier included after it.

- `ActionController::Renderers.add` (`vendor/rails/v8.0.2/actionpack/lib/action_controller/metal/renderers.rb:73-81`) defines `_render_with_renderer_<key>` on the module with `define_method`. It runs after the module is included: `ActionController.add_renderer` (`renderers.rb:7-10`) is called at app boot. That is a live include. In trails, `packages/actionpack/src/action-controller/metal/renderers.ts` keeps `Renderers` and `All` as `new Module` carriers and calls `Renderers.defineMethod`.
- `ActionController::Rendering#render_to_body` (`metal/rendering.rb:185-187`) and `ApiRendering#render_to_body` (`api/api_rendering.rb:13-16`) sit below `Renderers#render_to_body` (`renderers.rb:139-141`). If either became a plain module, its copy would outrank the `Renderers` carrier, so `metal/rendering.ts` and `api/api-rendering.ts` stay `new Module` with `superMethod`.
- `AbstractController::Rendering` (`abstract-controller/rendering.ts`) stays a carrier as well. `base-render-action.trails.test.ts` redefines a method on it after it is included.

## Converged shape

The renderer table is fixed before the include, per CLAUDE.md § "A method defined on a module after it is included": each `Renderers.add` call site defines `_render_with_renderer_*` before `Base` / `API` include the module, and a renderer added later reaches each includer the way Rails' shared method table does. That mechanism needs an owner decision, because a carrier and an includer list are both ruled out. After that, `Renderers`, `All`, `ActionController::Rendering`, `ApiRendering` and `AbstractController::Rendering` become plain-object modules, each `super` is `rbCallSuper`, and the test that redefines a method after the include defines it before.

## Acceptance criteria

- No `new Module` / `superMethod(` remains in `renderers.ts`, `metal/rendering.ts`, `api/api-rendering.ts` or `abstract-controller/rendering.ts`.
- `pnpm parity:modules:tighten` lowers actionpack's marks.
- An `add_renderer` called after `Base` is loaded still renders, or the owner records it as a permanent limit.
