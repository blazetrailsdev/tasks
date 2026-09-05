---
title: "Port Engine's add_mailer_preview_paths and restore add_view_paths' action_mailer arm"
status: blocked
updated: 2026-09-05
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: 20
pr: null
claim: "2026-09-05T00:22:11Z"
assignee: "async-overrides-of-synchronous-rails-adapter-methods"
blocked-by: "No @blazetrails/actionmailer package and no :action_mailer load hook exist yet; both the add_mailer_preview_paths initializer (engine.rb:622-627) and the dropped add_view_paths on_load(:action_mailer) arm (engine.rb:614-620) are unwritable until ActionMailer lands."
closed-reason: null
---

## Context

`Engine`'s `add_mailer_preview_paths` initializer (`engine.rb:622-627`) was left
undeclared by PR #7332 and recorded in `packages/trailties/src/engine.ts`'s
header comment:

```ruby
initializer :add_mailer_preview_paths do
  previews = paths["test/mailers/previews"].existent
  unless previews.empty?
    ActiveSupport.on_load(:action_mailer) { self.preview_paths |= previews }
  end
end
```

The path entry already exists —
`paths.add("test/mailers/previews", { autoload: true })`
(`packages/trailties/src/engine/configuration.ts`), mirroring
`engine/configuration.rb:109`. What is missing is ActionMailer itself: there is
no `@blazetrails/actionmailer` package and no `:action_mailer` load hook, which
is also why `add_view_paths` in the same file ports only the
`on_load(:action_controller)` arm and drops Rails'
`on_load(:action_mailer) { prepend_view_path(views) }` (`engine.rb:614-620`).

So this story is gated on ActionMailer landing, and when it does BOTH arms are
owed — the preview paths here and the dropped `add_view_paths` mailer arm.

## Converged shape

- `Engine` declares `add_mailer_preview_paths` at its Rails name, in Rails
  declaration order (between `add_view_paths` at `engine.rb:614` and
  `add_fixture_paths` at `:629`), with Rails' body.
- `add_view_paths` regains its `on_load(:action_mailer)` arm, and the JSDoc
  sentence in `engine.ts` saying the arm "is dropped — ActionMailer is not
  ported" is deleted.
- The `:add_mailer_preview_paths` entry is removed from `engine.ts`'s
  deliberately-not-declared header comment.
- `|=` is an order-preserving de-duplicating union, not a plain concat.
