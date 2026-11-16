---
title: "actiontext-engine-helper-reads-engine-helpers"
status: blocked
updated: 2026-11-15
rfc: "0219-actiontext-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-11-15T16:25:03Z"
assignee: "actiontext-engine-helper-reads-engine-helpers"
blocked-by: "operator decision: helpers sit flat in packages/actiontext/lib, so allHelpersFromPath derives 'content' -> constantize('ContentHelper') (top-level miss); needs a ruling on how an isolated engine's flat lib/ layout maps helper paths to its namespace"
closed-reason: null
---

## Context

`ActionText::Engine`'s `action_text.helper` initializer (`vendor/rails/v8.0.2/actiontext/lib/action_text/engine.rb:59-65`) is `helper ActionText::Engine.helpers` on `:action_controller_base` and `:action_mailer`. `Engine#helpers` (`packages/trailties/lib/engine.ts:248`) is async and collects modules from the engine's `app/helpers` path through `helperModulesFromPaths`, which constantizes a name derived from each file's path (`action_text/content_helper` -> `ActionText::ContentHelper`). actiontext keeps its helpers in `packages/actiontext/lib/content-helper.ts` / `tag-helper.ts` and registers no `app/helpers` path, so `packages/actiontext/lib/engine.ts` calls `this.helper(ContentHelper, TagHelper)` under `@missingRailsCall helpers — CONVERGEABLE actiontext-engine-helper-reads-engine-helpers`.

## Ruling

Operator ruling, 2026-11-16: mirror the gem's layout. The helpers move from
`packages/actiontext/lib/{content,tag}-helper.ts` to
`packages/actiontext/app/helpers/action-text/{content,tag}-helper.ts`, beside the
package's existing `app/views`, so the stock `allHelpersFromPath` glob derives
`action_text/content` and the namespace walk resolves `ActionText::ContentHelper`
as Rails does (`vendor/rails/v8.0.2/actiontext/app/helpers/action_text/`). No
engine-namespace resolution in `Engine#helpers` and no path override table.

## Acceptance criteria

- `content_helper.rb` / `tag_helper.rb` live at `packages/actiontext/app/helpers/action-text/`; parity path mapping, body pins and imports follow the move.
- `autoloadOncePaths` and the engine's `app/helpers` path point at the real directory (`packages/actiontext/lib/engine.ts:59-62` currently names a nonexistent `lib/app/helpers`).

- `ActionText::Engine` registers an `app/helpers` path whose files resolve to `ActionText::ContentHelper` and `ActionText::TagHelper`, and the `action_text.helper` initializer calls `helper(await Engine.helpers())` (or the onLoad shape the async read needs).
- The `@missingRailsCall helpers` receipt is removed.
