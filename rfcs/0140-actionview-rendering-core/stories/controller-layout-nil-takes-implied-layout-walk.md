---
title: "controller-layout-nil-takes-implied-layout-walk"
status: draft
updated: 2026-09-26
rfc: "0140-actionview-rendering-core"
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
closed-reason: null
---

## Context

Rails separates "no `layout` macro called" from a String layout.
`_write_layout_method` (`vendor/rails/v8.0.2/actionview/lib/action_view/layouts.rb:283-323`)
runs for every subclass through `inherited` (`:203-206`) and generates `_layout`
from that class's own `_layout` value:

- A String returns the literal. `resolve_layout` then raises when it is missing
  (`template_renderer.rb:99-106`).
- `false` means no layout.
- `nil` does `find_all(_implied_layout_name, ["layouts"]).first || super`
  (`:287`). `_implied_layout_name` (`:345`) defaults to `controller_path`, and
  anonymous classes go straight to `super`.

trails' `ActionController::Base` (`packages/actionpack/src/action-controller/base.ts:218`)
defaults `static layout = "application"`, where Rails' default is nil. It also
resolves the default layout with a single `findAll(layout, ["layouts"])` from
the owning class, with no per-ancestor `_implied_layout_name` walk. So a
`PostsController` never finds `layouts/posts`, and a `layout nil` subclass never
falls back to its parent's literal String.

The first revision of PR #8144 had a port of this: `static layout = null`, a
`_impliedLayoutName` hook, and a per-level walk. It was reviewed clean in
isolation, but #8140 merged first.

## Acceptance criteria

- [ ] `static layout` defaults to `null`; `_impliedLayoutName()` returns
      `controllerPath()`.
- [ ] The default-layout proc walks the class chain, branching per class on
      String / `false` / `null` as `_write_layout_method` does.
- [ ] Port `layout_test.rb`'s `LayoutAutoDiscoveryTest` (`application layout is
    default when no controller match`, `controller name layout name match`)
      and `abstract/layouts_test.rb`'s implied-child and grandchild cases, with
      Rails' names verbatim.
