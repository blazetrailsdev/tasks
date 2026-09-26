---
title: "Controller layout resolves through ActionView::Layouts (_implied_layout_name, _layout_for_option, conditions)"
status: draft
updated: 2026-09-26
rfc: "0140-actionview-rendering-core"
cluster: null
packages: ["actionpack", "actionview"]
deps: ["port-action-view-layouts-behind-rendering-stubs"]
deps-rfc: []
est-loc: 350
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActionController::Base#renderAsync` (`packages/actionpack/src/action-controller/base.ts`, the `layout:` render option built after trails#8140) resolves a controller's layout from trails' `static layout: string | false = "application"`. The value inherited from `Base` stands in for Rails' implied layout. A value a subclass sets itself goes through `_normalizeLayout` (`packages/actionview/src/layouts.ts`), as Rails' `layout "x"` does.

Rails decides this per class, in the generated `_layout(lookup_context, formats, keys)` (`vendor/rails/actionview/lib/action_view/layouts.rb:283-337`), regenerated on `inherited` (`:218-222`):

- **No `layout` declared.** `name_clause` / `default_behavior` is `lookup_context.find_all(_implied_layout_name, prefixes, false, keys, { formats: formats }).first || super` (`:286-294`), with `_implied_layout_name = controller_path` (`:340-343`). So `PostsController` tries `layouts/posts` first, then walks up via `super` until `ApplicationController` tries `layouts/application`. trails always tries only `"application"`.
- **`layout :symbol`.** Calls the instance method, and a `nil` result falls back to `default_behavior` (`:300-309`). Not ported.
- **`layout proc { ... }`.** Same fallback (`:310-317`). Not ported.
- **`layout false` / `layout true`.** `nil`, or `ArgumentError` at declaration (`:318-321`).
- **`only:` / `except:`.** `_layout_conditions` and `_conditional_layout?` (`:225-246,269-277,377-380`). Not ported.
- **`_layout_for_option`** (`:388-399`). String → `_normalize_layout`, Proc, `true` → `_default_layout(..., true)` (raises `ArgumentError` when no default layout exists, `:422-425`), `:default`, false/nil, else `ArgumentError`. `RenderOptions["layout"]` does not admit `true`.
- **`_default_layout`'s `NameError` rewrap** (`:416-420`).
- **`_include_layout?`** (`:430-432`). Skips layout resolution for `:body/:plain/:html/:inline/:partial` unless `:layout` is given, and `_process_render_template_options` (`:350-358`) only sets `options[:layout]` when it holds. trails' `render()` handles body/plain/html synchronously, but `inline:` currently falls through to `renderAsync`'s template arm.

Surfaced in review of trails#8140.

## Converged shape

- `renderAsync` builds its `layout:` option through `_process_render_template_options` → `_layout_for_option(name)`, where `name` defaults to `:default`, as `layouts.rb:350-358` does.
- The class-level layout comes from a ported `ActionView::Layouts` class macro (`layout(layout, conditions = {})`, `:269-277`) and `_write_layout_method`'s generated `_layout`. This replaces the static `layout` field and its owner walk.
- Builds on `port-action-view-layouts-behind-rendering-stubs`, which ports the module itself.

## Acceptance criteria

- A controller with no `layout` declaration renders through `layouts/<controller_path>` when it exists, else its ancestors' implied names, ending at `layouts/application`.
- `layout :sym`, `layout proc`, `layout false`, `only:` / `except:` and `render layout: true` behave as in `layouts.rb`, with Rails' `ArgumentError` messages.
- `render inline:` skips the default layout per `_include_layout?`.
- Port the relevant cases of `vendor/rails/actionview/test/actionpack/controller/layout_test.rb` with Rails test names verbatim. They replace the corresponding cases in `packages/actionpack/src/action-controller/base-layout.trails.test.ts`.
