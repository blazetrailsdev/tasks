---
title: "actionview-missing-template-rails-constructor"
status: done
updated: 2026-09-11
rfc: "0111-error-class-message-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#7711
claim: "2026-09-11T17:53:34Z"
assignee: "actionview-missing-template-rails-constructor"
blocked-by: null
closed-reason: null
---

## Context

Surfaced while converging `TemplateRenderer#resolve_layout`
(`actionview/lib/action_view/renderer/template_renderer.rb:92-113`).

- Rails `ActionView::MissingTemplate#initialize(paths, path, prefixes, partial, details, *)`
  (`actionview/lib/action_view/template/error.rb:41-60`) builds its message from the
  resolver paths, prefixes, partial flag and details.
- trails' `MissingTemplate` (`packages/actionview/src/lookup-context.ts:31-60`) takes
  `(controller, action, format, searchedPaths, candidatePaths)` and writes a different
  message. `PathSet#find` (`packages/actionview/src/path-set.ts:73-88`, Rails
  `path_set.rb:40-43`) now raises it, but has to squeeze Rails' arguments into the
  trails constructor (`prefixes[0]`, joined formats).
- Rails keeps the class in `template/error.rb`; trails defines it in `lookup-context.ts`.

## Acceptance criteria

- [ ] `MissingTemplate` takes Rails' constructor arguments and builds Rails' message.
- [ ] It lives at the file `parity:api` maps `template/error.rb` to.
- [ ] `PathSet#find` raises `MissingTemplate.new(self, path, prefixes, partial, details, details_key, locals)`'s TS spelling.
