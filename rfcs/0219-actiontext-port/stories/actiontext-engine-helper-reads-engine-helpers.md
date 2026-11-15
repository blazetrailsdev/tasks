---
title: "actiontext-engine-helper-reads-engine-helpers"
status: ready
updated: 2026-11-15
rfc: "0219-actiontext-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActionText::Engine`'s `action_text.helper` initializer (`vendor/rails/v8.0.2/actiontext/lib/action_text/engine.rb:59-65`) is `helper ActionText::Engine.helpers` on `:action_controller_base` and `:action_mailer`. `Engine#helpers` (`packages/trailties/lib/engine.ts:248`) is async and collects modules from the engine's `app/helpers` path through `helperModulesFromPaths`, which constantizes a name derived from each file's path (`action_text/content_helper` -> `ActionText::ContentHelper`). actiontext keeps its helpers in `packages/actiontext/lib/content-helper.ts` / `tag-helper.ts` and registers no `app/helpers` path, so `packages/actiontext/lib/engine.ts` calls `this.helper(ContentHelper, TagHelper)` under `@missingRailsCall helpers — CONVERGEABLE actiontext-engine-helper-reads-engine-helpers`.

## Acceptance criteria

- `ActionText::Engine` registers an `app/helpers` path whose files resolve to `ActionText::ContentHelper` and `ActionText::TagHelper`, and the `action_text.helper` initializer calls `helper(await Engine.helpers())` (or the onLoad shape the async read needs).
- The `@missingRailsCall helpers` receipt is removed.
