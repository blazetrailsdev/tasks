---
title: "port-controller-render-test-remaining"
status: done
updated: 2026-10-20
rfc: "0176-actionview-helpers"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#9155
claim: "2026-10-20T23:02:33Z"
assignee: "port-controller-render-test-remaining"
blocked-by: null
closed-reason: null
---

## Context

`port-controller-render-test` ported 35 of the 122 tests in
`vendor/rails/v8.0.2/actionview/test/actionpack/controller/render_test.rb` into
`packages/actionview/src/actionpack/controller/render.test.ts` (the simple render/layout/
plain/double-render arms, Rails lines 786-1240). The rest remain: instance-variable leak
(`:793`), line offset (`:828`), upcased action / MissingTemplate arms, `render file:`
arms (`:910-945`), xml/builder arms (`:1013-1050`), partials and collections
(`:1050`, `:1290-1544`), render_to_string assigns/exception arms (`:1155-1175`),
layout-around-block / content_for arms, xhr/js implicit render, and the remaining
controller actions in `TestController` (`:42-640`), plus `Fun::GamesController` /
`Quiz::QuestionsController` (`:7-35`).

## Acceptance criteria

- [ ] Every remaining test in `render_test.rb` is ported at the convention path with the Rails name verbatim, or parked as `it.skip` pointing at a story naming the unported method.
- [ ] `pnpm parity:test --package actionview` shows zero missing for `render_test.rb`.
