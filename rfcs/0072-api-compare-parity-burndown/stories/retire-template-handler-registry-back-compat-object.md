---
title: "retire-template-handler-registry-back-compat-object"
status: done
updated: 2026-08-11
rfc: "0072-api-compare-parity-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6243
claim: "2026-08-08T16:03:54Z"
assignee: "retire-template-handler-registry-back-compat-object"
blocked-by: null
closed-reason: null
---

## Context

`ActionView::Template::Handlers` is ported at
`packages/actionview/src/template/handlers.ts` as `TemplateHandlers`. The same
file also exports `TemplateHandlerRegistry`, a `@deprecated` back-compat object
literal that forwards every call to `TemplateHandlers` under non-Rails names
(`register`, `handlerForExtension`, `extensions`, `has`, `clear`) — Rails spells
these `register_template_handler`, `registered_template_handler`,
`template_handler_extensions`
(`vendor/rails/actionview/lib/action_view/template/handlers.rb:33-56`).

It is trails-only surface: `pnpm parity:api:extra --package actionview` scores
`TemplateHandlerRegistry`, `has` and `templatePath` as novel in that file. The
`defaultExt` / `setDefault` half was already deleted (no callers) by the PR for
`credit-mixin-methods-ported-in-their-own-file`; the rest has real callers and
so needs a sweep rather than a deletion.

Callers: `lookup-context.ts:20,44,553,576,721,725`, `template-details.ts:9,110`,
`digestor.test.ts:5,9`.

## Acceptance criteria

- `TemplateHandlerRegistry` is gone; its callers use `TemplateHandlers` at the
  Rails method names.
- `pnpm parity:api:extra --package actionview` drops the corresponding novel names with
  no allowlist rows added.
