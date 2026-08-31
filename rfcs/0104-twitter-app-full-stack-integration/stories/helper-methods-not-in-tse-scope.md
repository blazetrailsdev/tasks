---
title: "ActionView helpers and helper_method are invisible to .tse templates"
status: draft
updated: 2026-08-13
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: ["actionview", "actionpack"]
deps: ["execute-tse-templates"]
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

`helper_method` and the whole `ActionView` helper surface are invisible to a
`.tse` template. A template can only see the locals the controller passes.

`packages/actionview/src/template/handlers/tse.ts` builds the scope a
compiled template's bare identifiers resolve against in `scopeFor()`: a fixed
set of five view helpers (`render`, `raw`, `concat`, `capture`, `contentFor`)
plus a `yield` getter, then `Object.assign(scope, locals)`. There is no
connection to the controller's view context, so:

- `helper_method :current_user`
  (`packages/actionpack/src/abstract-controller/helpers.ts:138`) installs the
  proxy onto the controller's helpers module, and no `.tse` template can
  reach it.
- None of `packages/actionview/src/helpers/**` — `tag`, `link_to`,
  `form_with`, `number_to_currency`, the whole directory — is in scope
  either. A template calling `<%= link_to "Home", "/" %>` gets
  `ReferenceError: link_to is not defined`.

Rails compiles a template into a method **on the view object**
(`vendor/rails/actionview/lib/action_view/template.rb`, `compile!` →
`mod.module_eval`), so `self` is an `ActionView::Base` that has already had
every helper module and the controller's `_helpers` mixed in
(`vendor/rails/actionview/lib/action_view/base.rb`). Bare identifiers in a
template are ordinary method calls on that object; `local_assigns` is a
separate hash layered on top.

`examples/twitter-app` works around this by passing everything as explicit
locals from a `layoutLocals()` method on `ApplicationController`, which is
not how a Rails app is written.

## Acceptance criteria

- A compiled `.tse` template resolves helpers from an `ActionView::Base`-like
  view object rather than a fixed literal in `scopeFor`.
- `packages/actionview/src/helpers/**` are reachable as bare identifiers in a
  template.
- `helper_method :current_user` on a controller makes `current_user`
  resolvable in that controller's templates.
- Locals still shadow helpers, matching Ruby's block-parameter/method
  precedence.
- `examples/twitter-app` drops `layoutLocals()` and its `TODO`.
