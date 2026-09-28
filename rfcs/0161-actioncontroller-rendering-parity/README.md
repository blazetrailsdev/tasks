---
rfc: "0161-actioncontroller-rendering-parity"
title: "ActionController rendering — Rendering, Renderers, Streaming and Live to parity"
status: draft
created: 2026-09-27
updated: 2026-09-27
owner: "@deanmarano"
packages:
  - "actionpack"
clusters: []
---

# RFC 0161 — ActionController rendering: Rendering, Renderers, Streaming and Live to parity

## Summary

Take the controller half of rendering to 100% on every parity axis:
`AbstractController::Rendering` (`abstract_controller/rendering.rb`),
`ActionController::Rendering`, `Renderers`, `ImplicitRender`,
`BasicImplicitRender`, `Streaming` and `Live` (`action_controller/metal/*.rb`),
`ActionController::Renderer` (`renderer.rb`), `ApiRendering`
(`api/api_rendering.rb`) and `FormBuilder` (`form_builder.rb`) — and port the
controller test files that exercise them, which are the largest wholly
unported block in actionpack: 33 Rails test files, 366 tests.

This is one of eight actionpack RFCs (0160–0167; RFC 0167 owns measurement fixes and gate enrollment). It depends on RFC 0160 (test harness) for
`Rack::TestCase` and the fixtures, and on RFC 0140's
`controller-render-converges-onto-abstract-controller-render` for the single
render path the tests exercise.

## Motivation

### Measured state, 2026-09-27

trails `main` @ `114cf8364c`, after `pnpm build` and
`API_COMPARE_FORCE=1 pnpm parity:api`.

API (`pnpm parity:api --package actioncontroller` / `abstractcontroller`):

| Rails file                             | Methods | Gap                                                                  |
| -------------------------------------- | ------- | -------------------------------------------------------------------- |
| `action_controller/metal/renderers.rb` | 7/16    | `add`, `remove`, `use_renderer(s)`, the `_renderers` class attribute |
| `action_controller/metal/rendering.rb` | 14/15   | `render`                                                             |
| `action_controller/renderer.rb`        | 9/10    | `normalize_env`                                                      |
| `action_controller/form_builder.rb`    | 2/5     | the `_default_form_builder` class attribute                          |
| `abstract_controller/rendering.rb`     | 11/16   | 5 declaration-only rows                                              |

Extra surface (`pnpm parity:api:extra`): `renderAsync` and `templateResolver`
(novel) on `base.ts`; `isStreamingRequest` and `prepareStreamingHeaders` on
`metal/streaming.ts`; `renderForApi` on `api/api-rendering.ts` and re-exported
from `action-controller/index.ts`; moved names on `renderer.ts` (3),
`metal/live.ts` (1) and `metal/renderers.ts` (1).

Call baseline rows: `actioncontroller/metal/live.json` 5,
`actioncontroller/renderer.json` 2, `actioncontroller/metal/rendering.json` 1.

Tests (`pnpm parity:test --package actioncontroller`) — every file below is
absent from trails, or holds only misplaced copies:

| Rails test files                                                                                                                                                                                        | Tests |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- |
| `new_base/render_action`, `render_template`, `render_layout`, `render_partial`, `render_file`, `render`                                                                                                 | 68    |
| `new_base/render_body`, `render_html`, `render_plain`                                                                                                                                                   | 40    |
| `new_base/content_type`, `content_negotiation`, `render_implicit_action`, `render_streaming`                                                                                                            | 27    |
| `controller/content_type_test.rb`                                                                                                                                                                       | 14    |
| `controller/renderer_test.rb`                                                                                                                                                                           | 25    |
| `renderers`, `metal/renderers`, `api/renderers`, `api/implicit_render`, `render_js`, `render_xml`, `render_to_string`, `output_escaping`, `localized_templates`, `form_builder`, `chunked`, `streaming` | 35    |
| `controller/live_stream_test.rb`                                                                                                                                                                        | 37    |

One `render_to_string_test.rb` row is a phantom (a controller action named
`test_*`); RFC 0167 removes it.

## Design

### The render path is RFC 0140's, not this RFC's

RFC 0140's `controller-render-converges-onto-abstract-controller-render`
replaces `Base#render`'s hand-written option dispatcher with Rails' chain. Every
story here that ports a render test depends on it; none of them re-litigates
the dispatcher. The invented `renderAsync` is retired by that story, and
`templateResolver` by RFC 0141's `controller-template-resolver-is-invented-surface`.

### Renderers is a registry with Rails' names

`ActionController::Renderers.add` / `.remove` mutate `RENDERERS` and define
`_render_with_renderer_#{key}` (`renderers.rb:73-88`); a controller narrows
its set with `use_renderers` (`:127-131`) over the `_renderers` class attribute
(`:31`). trails keeps the renderers as a fixed map. The class attribute ports
through `classAttribute()` from `@blazetrails/activesupport`.

### Invented helpers fold into the Rails method they stand in for

`isStreamingRequest` / `prepareStreamingHeaders` are two halves of
`Streaming#_render_template` (`streaming.rb:172-181`). `renderForApi` stands in
for `ApiRendering#render_to_body` (`api/api_rendering.rb:13`). Each folds back.

### Prior art folded in by reference

| Story                                                         | RFC  | Bearing                                                                                           |
| ------------------------------------------------------------- | ---- | ------------------------------------------------------------------------------------------------- |
| `controller-render-converges-onto-abstract-controller-render` | 0140 | The render path; a dependency of every test story                                                 |
| `controller-render-inline-renders-the-action-template`        | 0141 | `render inline:`                                                                                  |
| `controller-render-stream-option-is-ignored`                  | 0141 | `render stream: true`; `port-new-base-content-type-negotiation-and-streaming-tests` depends on it |
| `controller-template-resolver-is-invented-surface`            | 0141 | `Base.templateResolver`                                                                           |
| `render-to-string-snapshots-the-response`                     | 0141 | `render_to_string`                                                                                |
| `abstract-normalize-render-self-dispatches-process-variant`   | 0141 | `_normalize_render`                                                                               |
| `action-controller-normalize-options-does-not-call-super`     | 0141 | `_normalize_options` chain                                                                        |
| `live-buffer-queue-is-not-a-blocking-sized-queue`             | 0141 | `Live::Buffer`; the live tests depend on it                                                       |
| `api-redirect-to-override-and-head-response-are-invented`     | 0141 | `api.ts` moved names                                                                              |

### Prior-art status (trails `main` @ `2558bb83f4`)

Already landed: `abstract-normalize-render-self-dispatches-process-variant`,
`controller-render-inline-renders-the-action-template`;
`action-controller-normalize-options-does-not-call-super` was closed. They stay
listed because the ported tests are what verify them.

## Non-goals

- **`ActionView::Rendering` and the view renderer.** That is RFC 0140.
- **`controller/render_test.rb`.** Despite the name, 80 of its 88 tests are
  HTTP caching (`expires_in`, `fresh_when`, etags, `head`,
  `http_cache_forever`); it belongs to RFC 0162 (controller metal) with `ConditionalGet`.
- **`new_base/bare_metal_test.rb`, `new_base/base_test.rb`,
  `new_base/middleware_test.rb`.** They test `Metal` and `Base`, not rendering;
  metal RFC.

## Alternatives considered

- **Porting the render tests before the render path converges.** They would
  pass against the hand-written dispatcher, which is exactly the thing RFC 0140
  is deleting; each would then be re-verified. Waiting costs nothing, since the
  dependency is filed and `ready`.

## Rollout

1. API — `renderers-registry-and-renderers-class-attribute`,
   `renderer-normalize-env-and-moved-readers`,
   `abstract-rendering-hooks-and-default-form-builder`,
   `streaming-and-api-rendering-fold-invented-helpers`
2. Tests — `port-new-base-render-action-and-layout-tests`,
   `port-new-base-render-template-partial-and-file-tests`,
   `port-new-base-render-body-html-and-plain-tests`,
   `port-new-base-content-type-negotiation-and-streaming-tests`,
   `port-content-type-test`, `port-renderer-test`,
   `port-renderers-and-format-render-tests`,
   `port-live-stream-test-sse-and-streaming`,
   `port-live-stream-test-threads-and-router`
3. Close — `rendering-parity-residue`

## Verification

- `pnpm parity:api` reports each Rails file in the API table at 100%.
- `pnpm parity:api:extra --package actioncontroller` lists no name on
  `metal/streaming.ts`, `api/api-rendering.ts`, `renderer.ts`, `metal/live.ts`
  or `metal/renderers.ts`, and no `renderForApi` on `index.ts`.
- No row remains in the three call baseline shards above.
- `pnpm parity:test --package actioncontroller` reports every file in the tests
  table complete: 0 missing, 0 skipped, 0 misplaced.

## Open questions

None.

## Changelog

- 2026-09-27: initial RFC
- 2026-09-27: re-measured on trails `main` @ `2558bb83f4`; no change to this RFC's rows. Recorded prior-art stories that have since landed.
