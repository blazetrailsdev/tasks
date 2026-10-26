---
title: "template-handlers-is-template-extended-handlers"
status: claimed
updated: 2026-10-26
rfc: "0120-extra-surface-gating-rollout"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-10-26T18:59:10Z"
assignee: "activerecord-test-support-extra-surface-burndown-remainder"
blocked-by: null
closed-reason: null
---

## Context

`packages/actionview/src/template/handlers.ts:20` exports the registry as a
plain object `TemplateHandlers`. Rails defines it as `ActionView::Template::Handlers`
(`vendor/rails/v8.0.2/actionview/lib/action_view/template/handlers.rb:6`), a
module `Template` extends (`template.rb`, `extend Template::Handlers`), so its
`self.extended` hook registers the default handlers and every caller says
`ActionView::Template.register_template_handler`. `TemplateHandlers` is a name
with no Ruby counterpart, receipted `@noRailsEquivalent CONVERGEABLE` against
this story by `burn-down-and-enroll-actionview`. About 185 references across
50 files name it.

## Acceptance criteria

- The module is `Handlers` in `template/handlers.ts`, extended onto `Template`
  with `extend()`, and callers use `Template.registerTemplateHandler` etc.
- `TemplateHandlers` and its receipt are deleted; actionview's extra-surface
  mark is tightened.
