---
title: "actiontext-controller-render-renderer-reaches-action"
status: in-progress
updated: 2026-11-15
rfc: "0219-actiontext-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#10120
claim: "2026-11-15T11:49:43Z"
assignee: "actiontext-controller-render-renderer-reaches-action"
blocked-by: null
closed-reason: null
---

## Context

Two tests in `packages/actiontext/test/integration/controller-render.test.ts` are parked:
"uses current request environment" and "renders as HTML when the request format is not HTML"
(`vendor/rails/v8.0.2/actiontext/test/integration/controller_render_test.rb:6-25`).

1. The renderer does not reach the action. The engine's `action_text.renderer` initializer
   (`packages/actiontext/lib/engine.ts`, Rails `engine.rb:68-76`) installs
   `aroundAction((controller, action) => Content.withRenderer(controller, action))`.
   `withRenderer` (`packages/actiontext/lib/rendering.ts`) runs its block inside
   `IsolatedExecutionState.fork`. Probes showed this during a request to `MessagesController#show`:
   `Content.renderer` reads `MessagesController` synchronously after the setter. It reads `null`
   in a microtask the block schedules, and when the view renders the attachment. So
   `Content.render` falls back to `actionControllerRenderer()`, and URLs come out as
   `http://example.org/...` where Rails gives `//loocalhoost/`. The same `withRenderer` call keeps
   the value across a microtask when called outside a request
   (`Content.withRenderer("R1", () => Promise.resolve().then(...))`). So something on the
   request path drops or clears the fork's store. Candidates are
   `activesupport/lib/callbacks.ts` `runCallbacks`' trampolined `invokeSequence` / `observeProceed`
   (around callbacks), and `IsolatedExecutionState.clear` via the `isolationLevel` setter
   (`isolated-execution-state.ts:109`).
2. The blob must be representable. actiontext's `test-helper.ts` does not run ActiveStorage's
   `active_storage.configs` / `active_storage.verifier` initializers, so
   `ActiveStorage.variableContentTypes` is `[]` and `_blob.html.tse` renders no `<img>`.
   Running them in the helper reds `content.test.ts` "identifies destroyed attachables as missing"
   (`Missing model class ActiveStorage::VariantRecord`, because `trackVariants` is on).

## Acceptance criteria

- Find and fix the context loss, so a thread-local set inside an around_action block is visible to
  the action's async render.
- Boot ActiveStorage's config in the actiontext test helper without breaking `content.test.ts`.
- Un-skip both tests. They pass with Rails' assertions.
