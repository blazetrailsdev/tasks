---
title: "Precompiled views bake the build environment's annotate_rendered_view_with_filenames"
status: draft
updated: 2026-10-28
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`trails-tsc-views build` decides at BUILD time whether each compiled view
emits `<!-- BEGIN app/views/... -->` comments, reading
`Base.annotateRenderedViewWithFilenames` from the environment the build ran
under (`packages/trails-tsc/src/build-views.ts:118`, applied as a preamble in
`packages/trails-tsc/src/plugins/tse.ts:211-228`). The output is then loaded by
any process, whatever environment it runs in.

Rails reads `annotate_rendered_view_with_filenames` when it compiles a
template too (`actionview/lib/action_view/template/handlers/erb.rb`), but it
compiles lazily inside the running process, so the setting always belongs to
the environment that renders. trails' ahead-of-time build breaks that.

Surfaced by trailmap#83: booting `trails server` in development rebuilt the
views with annotations, and `pnpm test` then failed five
`test/views/status-badge.test.ts` cases (`expected '<!-- BEGIN app/views/shared/_status-b…'`)
until the views were rebuilt. Nothing said the artifact came from another
environment.

## Expected shape

The annotation follows the RENDERING process's config, as in Rails: either the
preamble is emitted unconditionally and gated at render time on
`ActionView::Base.annotate_rendered_view_with_filenames`, or the build
records the environment it was made under and the loader refuses (or rebuilds)
a mismatch with a message naming both.

## Acceptance criteria

- Views built under development and rendered under test produce no
  `BEGIN`/`END` comments, and the reverse produces them; a test in trails covers both.
- trailmap's `test/views/status-badge.test.ts` passes after a development build.
