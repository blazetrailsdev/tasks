---
title: "Delete Handlers.clear; tests restore handlers as Rails does"
status: in-progress
updated: 2026-10-27
rfc: "0120-extra-surface-gating-rollout"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: trails#9383
claim: "2026-10-27T17:16:19Z"
assignee: "activerecord-test-support-extra-surface-burndown-remainder"
blocked-by: null
closed-reason: null
---

## Context

trails#9345 converted `TemplateHandlers` into `Handlers` (`packages/actionview/src/template/handlers.ts`), a class module extended onto `Template` (`vendor/rails/v8.0.2/actionview/lib/action_view/template/handlers.rb`). It kept a test-only `/** @internal */ static clear()` that wipes the `@@template_handlers` / `@@default_template_handlers` / `@@template_extensions` stand-ins. `handlers.rb` has no such method. Rails tests restore handlers with `unregister_template_handler` (`handlers.rb:39-45`) or by re-registering. About 40 test call sites use `Handlers.clear()`, followed by re-registration.

## Acceptance criteria

- `Handlers.clear` is deleted.
- Each test caller restores state the way the matching Rails test does, using `Template.unregisterTemplateHandler` / `registerTemplateHandler`, or does not reset at all when the Rails test doesn't.
- `pnpm parity:api:extra --package actionview` shows no `clear` in `template/handlers.ts`.
