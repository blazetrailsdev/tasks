---
title: "QueryLogs keeps instance state and lazy handlers where Rails precomputes @handlers on the module"
status: draft
updated: 2026-09-26
rfc: "0155-assertion-surfaced-port-bugs"
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
closed-reason: null
---

## Context

`ActiveRecord::QueryLogs` is a module whose state lives on its singleton class
(`vendor/rails/v8.0.2/activerecord/lib/active_record/query_logs.rb:104-137`): `@taggings`, `@tags`,
`@tags_formatter`, and `@handlers`, which `taggings=` / `tags=` rebuild through
`rebuild_handlers` (`:165-178`) and `build_handler` (`:180-193`).

trails' `packages/activerecord/src/query-logs.ts` diverges in shape:

- `QueryLogs` is an instance class, and callers reach the state through the singleton
  `queryLogs` (`query-logs-instance.ts`, exported since trails#8131). Rails has no instance.
- `tagContent` re-derives each tag's handler lazily on every comment. It never uses a
  precomputed `@handlers` list. The module-level `rebuildHandlers` / `buildHandler` exist
  but the class does not call them.
- The object-tag branch in `tagContent` calls a function handler with `context`
  regardless of arity. Rails wraps an arity-0 proc in `ZeroArityHandler` (`:185-187`).
- `tags_formatter=` raises `ArgumentError, "Formatter is unsupported: #{format}"`
  (`:127-135`). trails raises `ConfigurationError` with an invented message and accepts
  formatter objects Rails rejects.

## Converged shape

`QueryLogs` becomes the module singleton, with its state set by the setters. `taggings=`
and `tags=` store their value and set `_handlers = rebuildHandlers()`. `tagContent`
iterates `_handlers`, as `tag_content` does. `tagsFormatter=` matches only `"legacy"` /
`"sqlcommenter"` and raises `ArgumentError("Formatter is unsupported: " + format)`.

## Acceptance criteria

- `rebuildHandlers` / `buildHandler` are the only handler builders, and `taggings=` /
  `tags=` call them.
- An arity-0 lambda in a hash tag gets no context argument.
- `tagsFormatter = "bogus"` raises `ArgumentError` with Rails' message.
- `pnpm parity:api:calls` stays green.
