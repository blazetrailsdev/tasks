---
title: "Template handlers carry an invented extensions field"
status: ready
updated: 2026-09-26
rfc: "0140-actionview-rendering-core"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: 10
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActionView::Template::Handlers` handlers are plain callables. Rails registers `Raw.new`, `ERB.new`, `Html.new` and a lambda (`vendor/rails/v8.0.2/actionview/lib/action_view/template/handlers.rb:12-18`). None of them has an `extensions` member: the extensions are the registry's keys (`register_template_handler(*extensions, handler)`, `:43-52`).

trails' `TemplateHandler` interface (`packages/actionview/src/template/handlers.ts`) declares `readonly extensions?: string[]` (made optional in trails#8135). Some handlers carry one anyway:

- `Raw` (`template/handlers/raw.ts`) sets `extensions = ["raw", "txt", "html", "ruby"]`. Nothing reads it, and `handlers.test.ts` asserts on it.
- `Tse` sets `extensions = ["tse"]`.
- The test doubles in `dependency-tracker.test.ts`, `template.test.ts` and `view-paths.trails.test.ts` set it too.

## Acceptance criteria

- `extensions` is removed from the `TemplateHandler` interface, `Raw` and `Tse`. Test doubles are the `{ call }` shape only.
- The `Raw` test that asserts `extensions` is removed or rewritten against `TemplateHandlers.extensions()`.
- `pnpm parity:api:extra --package actionview` no longer lists `extensions` on the handler classes.
