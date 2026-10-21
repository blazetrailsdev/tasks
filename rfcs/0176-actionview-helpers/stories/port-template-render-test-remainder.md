---
title: "port-template-render-test-remainder"
status: in-progress
updated: 2026-10-20
rfc: "0176-actionview-helpers"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#9158
claim: "2026-10-20T23:21:47Z"
assignee: "port-template-render-test-remainder"
blocked-by: null
closed-reason: null
---

## Context

Follow-up to `port-template-render-test`, which ported the first ~50
`RenderTestCases` tests of `vendor/rails/v8.0.2/actionview/test/template/render_test.rb`
into `packages/actionview/src/template/render.test.ts` (describe
`CachedViewRenderTest`, FixtureResolver fixtures transcribed from
`actionview/test/fixtures/`, `Template.mimeTypesImplementation = Mime` as
abstract_unit's loaded ActionDispatch does).

Still missing (run `pnpm parity:test --package actionview` for the live list):
the `@controller_view` tests (`render_test.rb:45-63`, `:500-540` — need a
`TestController` view context), error/annotated-source tests (`:212-260`,
`:355-390`), renderable-object tests (`:395-405`), custom template handler
tests (`:575-640`), layout block/yield tests (`:640-750`), spellcheck tests
(`:705-735`), `render object` / `render_mutate_string_literal`, the
`FrozenStringLiteralEnabledViewRenderTest`, `CachedViewRenderTest` caching
tests (`:813-838`), `LazyViewRenderTest` UTF-8 tests (`:852-890`) and
`CachedCollectionViewRenderTest` (`:891-1013`).

## Acceptance criteria

- [ ] Every remaining test in `render_test.rb` is ported into `template/render.test.ts` with the Rails name verbatim, or parked as `it.skip` naming the story / ratified CLAUDE.md section it waits on.
- [ ] `pnpm parity:test --package actionview` shows zero missing for `render_test.rb`.
