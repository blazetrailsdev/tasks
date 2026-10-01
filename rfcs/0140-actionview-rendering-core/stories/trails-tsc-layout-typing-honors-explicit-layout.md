---
title: "trails-tsc: type layouts from explicit layout()/render layout: choices, not only the implied name"
status: done
updated: 2026-10-01
rfc: "0140-actionview-rendering-core"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: 1
pr: trails#8315
claim: "2026-09-30T21:11:51Z"
assignee: "action-controller-render-is-untyped"
blocked-by: null
closed-reason: null
---

## Context

`trails-tsc-views build` types a layout from the controllers that render it (`layoutOf` in `packages/trails-tsc/src/build-views.ts`, PR #8296). It only follows the implied-name fallback: `layouts/#{controller_path}`, then the superclass's layout through `super` (`vendor/rails/v8.0.2/actionview/lib/action_view/layouts.rb:283-287,345-347`).

Rails picks a layout from these sources first, and the typing ignores them:

- A class-level `layout "name"` / `layout :method` / `layout false`, with `only:` / `except:` conditions. `ActionView::Layouts::ClassMethods#layout` (`layouts.rb:269-275`) stores `_layout` and `_layout_conditions`, and `_write_layout_method` (`layouts.rb:283-324`) compiles `_layout` from the stored value before it falls back to the implied name. trails ports this as `layout()` in `packages/actionview/src/layouts.ts:60`.
- A per-render `render layout: "name"` / `layout: false`, resolved by `_layout_for_option` (`layouts.rb:388-413`) before `_default_layout` (`layouts.rb:415-430`).

So a controller that has its own `layouts/posts` but declares `layout("application")` renders `layouts/application`, and its fields are missing from that layout's type.

## Converged shape

In the checker pass, a controller's layout set is:

1. string literals passed to its class-level `layout(...)` calls, found along its superclass chain (the nearest call wins, as `class_attribute` inheritance does);
2. plus every `layout: "<name>"` string literal in its own `render(...)` calls;
3. and only when neither applies, the implied-name fallback that exists today.

`layout(false)` / `layout: false` contribute nothing. A symbol/method layout (`layout(":method")` or a function), or a non-literal value, makes the controller contribute to every layout, since the static choice is unknown.

## Acceptance criteria

- [ ] A controller with `static { layout(this, "application") }` and its own `layouts/posts.html.tse` contributes its members to `layouts/application`, not `layouts/posts`.
- [ ] A `render("show", { layout: "admin" })` in a controller adds that controller to `layouts/admin`.
- [ ] `layout(false)` removes the controller from every layout.
- [ ] Each case has a test in `packages/trails-tsc/src/build-views.test.ts`.
