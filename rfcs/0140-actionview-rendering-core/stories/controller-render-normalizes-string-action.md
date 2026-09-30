---
title: 'ActionView::Rendering#_normalize_args string/Symbol arm: render("new") renders the action'
status: done
updated: 2026-09-30
rfc: "0140-actionview-rendering-core"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: 2
pr: trails#8266
claim: "2026-09-30T09:49:52Z"
assignee: "actionview-rendering-methods-have-no-super-chain"
blocked-by: null
closed-reason: null
---

## Context

Surfaced in trails#8221. Rails' `ActionView::Rendering#_normalize_args`
(`vendor/rails/v8.0.2/actionview/lib/action_view/rendering.rb:153-170`) handles
`render :new` / `render "posts/new"`:

```ruby
when String, Symbol
  action = action.to_s
  key = action.include?(?/) ? :template : :action
  options[key] = action
```

`ActionController::Base` in trails (`packages/actionpack/src/action-controller/base.ts:917`) uses
`AbstractController::Rendering`'s `_normalizeArgs`
(`packages/actionpack/src/abstract-controller/rendering.ts:83-94`). That function only accepts a
permitted params object or a Hash and drops a String action. So `this.render("new", { status })` loses
the action. The scaffold controller therefore emits `render({ action: "new", status: "unprocessable_entity" })`
(`packages/trailties/src/generators/rails/scaffold-controller/scaffold-controller-generator.ts`), where
`controller.rb.tt:31,40` reads `render :new, status: :unprocessable_entity`.

A Ruby Symbol here is the plain string `"new"` (`action.to_s`), so no colon discriminator is needed.

## Acceptance criteria

- `ActionView::Rendering#_normalize_args` is ported with its `nil` / Hash / String-or-Symbol / permitted /
  else arms in Rails order, calling `super` into `AbstractController::Rendering#_normalize_args`, and
  `ActionController::Base` reaches it.
- `render("new", { status: "unprocessable_entity" })` renders the `new` action, and `render("posts/new")`
  renders a template.
- The scaffold controller emits `this.render("new", { status: "unprocessable_entity" })` and
  `this.render("edit", …)`, as `controller.rb.tt:31,40` does.
