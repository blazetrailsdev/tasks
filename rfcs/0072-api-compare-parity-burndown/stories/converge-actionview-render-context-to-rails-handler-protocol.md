---
title: "Converge ActionView RenderContext to the Rails handler protocol"
status: closed
updated: 2026-08-08
rfc: "0072-api-compare-parity-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Out of scope: RFC 0072 rescoped to activerecord and its dependencies; actionview dropped from the RFC's packages list. The convergence itself is still valid work — refile under an actionview-owning RFC if it is wanted."
---

## Context

After #6243 removed `TemplateHandlerRegistry`, `pnpm parity:api:extra --package actionview`
still scores 3 novel names in `packages/actionview/src/template/handlers.ts`:
`TemplateHandlers`, and the `RenderContext` fields `templatePath` and `yield`.

`RenderContext` is a trails invention: Rails handlers are callables invoked as
`handler.call(template, source)` and receive no context struct
(`vendor/rails/actionview/lib/action_view/template/handlers.rb:26-32`, and
`vendor/rails/actionview/lib/action_view/template.rb` for the compile/call
protocol). The `templatePath` field exists only so `LookupContext#renderTemplate`
can pass a path for error reporting
(`packages/actionview/src/lookup-context.ts:731`); Rails gets that from
`Template#identifier`. `yield` mirrors nothing in Rails' handler protocol either.

`TemplateHandlers.clear()` is also trails-only (`@internal`, test isolation) —
Rails has no counterpart.

## Acceptance criteria

- `RenderContext`'s trails-only fields are removed or replaced by the Rails
  shape (handler receives the template, reads `identifier` itself).
- `pnpm parity:api:extra --package actionview` drops the corresponding novel names with
  no allowlist rows added.
- If a field genuinely cannot converge, it carries a `@noRailsEquivalent` tag
  with a reviewed reason at the declaration.
