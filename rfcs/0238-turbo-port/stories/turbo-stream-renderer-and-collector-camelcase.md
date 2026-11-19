---
title: "turbo_stream renderer key and collector mime methods are camelCase"
status: done
updated: 2026-11-19
rfc: "0238-turbo-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#10362
claim: "2026-11-19T15:31:41Z"
assignee: "turbo-stream-renderer-and-collector-camelcase"
blocked-by: null
closed-reason: null
---

## Context

The Node-casing rule (CLAUDE.md "Casing is translated, never mirrored") makes option keys and method names camelCase. Three multi-word turbo spellings are still snake_case:

- `packages/turbo/lib/engine.ts`: `ActionController.Renderers.add("turbo_stream", …)` (Rails `engine.rb`'s `ActionController::Renderers.add :turbo_stream`). So a controller writes `render({ turbo_stream: … })` where the camelCase key is `turboStream`.
- `packages/actionpack/lib/abstract-controller/collector.ts` `generateMethodForMime` defines `symbolToS(sym)`. So `respond_to`'s `format.turbo_stream` is snake_case for every multi-word Mime symbol.
- `packages/turbo/lib/app/helpers/turbo/streams/action-helper.ts:29-36`: `this.tag().turbo_stream(...)`.

`packages/turbo/test/dummy/app/controllers/messages-controller.ts#create` (trails#10351) reaches the first two through casts.

## Acceptance criteria

- The renderer key is `turboStream`, and `render({ turboStream })` typechecks with no cast.
- Collector mime methods are camelCase (`format.turboStream`). The Mime symbol stays `:turbo_stream`.
- The `tag().turbo_stream` call is spelled the way the tag builder's casing rule says.
- The casts in `messages-controller.ts#create` are removed.
