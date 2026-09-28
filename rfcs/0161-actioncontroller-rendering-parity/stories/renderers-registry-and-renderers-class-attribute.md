---
title: "Port Renderers.add / remove / use_renderers and the _renderers class attribute"
status: draft
updated: 2026-09-27
rfc: "0161-actioncontroller-rendering-parity"
cluster: null
packages: ["actionpack"]
deps: ["controller-render-converges-onto-abstract-controller-render"]
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

`pnpm parity:api --package actioncontroller` reports `metal/renderers.rb` at
7/16. Rails' `ActionController::Renderers`
(`vendor/rails/v8.0.2/actionpack/lib/action_controller/metal/renderers.rb`):

- `RENDERERS = Set.new` (`:28`)
- `class_attribute :_renderers, default: Set.new.freeze` in the `included` block
  (`:31`), set to `RENDERERS` for `Renderers::All` (`:41`)
- `Renderers.add(key, &block)` (`:73`) defines `_render_with_renderer_#{key}` and
  adds `key` to `RENDERERS`; `Renderers.remove(key)` (`:83`) undoes both
- `ClassMethods#use_renderers(*args)` (`:127`), aliased `use_renderer` (`:131`)

The `_renderers` rows also count against `base.rb` (3) because `Base` includes
the module.

trails' `packages/actionpack/src/action-controller/metal/renderers.ts` keeps a
fixed map and has none of these names. `pnpm parity:api:extra` scores its `get`
as moved.

## Acceptance criteria

- `Renderers.add` / `Renderers.remove` exist at the Rails names and mutate
  `RENDERERS` and the generated `_renderWithRenderer…` methods, as Rails does.
- `_renderers` is a `classAttribute()` from `@blazetrails/activesupport`, with
  Rails' default and Rails' reassignment in `Renderers::All`.
- `useRenderers` / `useRenderer` narrow the set per controller.
- `pnpm parity:api` reports `metal/renderers.rb` 16/16 and no `_renderers` row
  on `base.rb`; `metal/renderers.ts` has no extra surface.
