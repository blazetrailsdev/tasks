---
title: "ActionText::Engine registers lib/tasks and the install generator's load path"
status: ready
updated: 2026-11-14
rfc: "0219-actiontext-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#10039 shipped `packages/actiontext/lib/generators/action-text/install/install-generator.ts`,
`lib/trails/generators/test-unit/install/install-generator.ts` and `lib/tasks/actiontext.ts`
(mirroring `vendor/rails/v8.0.2/actiontext/lib/tasks/actiontext.rake`). Nothing reaches them yet:
`packages/actiontext` has no `engine.ts`, so nothing puts its `lib` on `LOAD_PATH`. That entry is what
`Generators.lookup` scans (`packages/trailties/lib/generators.ts:128-157`), and `lib/tasks` is not
registered either. Rails loads both through `ActionText::Engine` (`vendor/rails/v8.0.2/actiontext/lib/action_text/engine.rb`)
and the gem's `lib` on the load path. For the shape to copy, see actionmailbox's
`this.config.paths().add("lib/tasks", { with: ..., glob })` (`packages/actionmailbox/src/engine.ts:54-57`).

## Acceptance criteria

- Once `actiontext-engine` lands, `ActionText::Engine` registers `lib/tasks`, as actionmailbox's does.
- `trails generate action_text:install` resolves through `Generators.findByNamespace` in a booted app,
  and its `hook_for :test_framework` resolves `test_unit:install`.
- `rake action_text:install` is listed and runs from a generated app.
