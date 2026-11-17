---
title: "Precompiled views bake annotateRenderedViewWithFilenames at build time, so a test env renders development's BEGIN/END comments"
status: closed
updated: 2026-11-17
rfc: "0142-trailties-surfaced-deviations"
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
closed-reason: "Duplicate of precompiled-views-bake-the-build-environments-annotation (same build-time bake of annotateRenderedViewWithFilenames); trailmap#153 context: test/views/status-badge.test.ts withoutAnnotations is the workaround to delete."
---

## Context

Surfaced by trailmap#153 (story status-badge-test-fails-after-a-local-views-build).

`trails-tsc-views build` reads `Base.annotateRenderedViewWithFilenames` once, at build time
(`packages/trails-tsc/src/plugins/tse.ts` `tseHandlerScope`, called from `build-views` — vendored
`trails-tsc/dist/build-views.js:90`, literals at `dist/plugins/tse.js:175-176`), and bakes the
`<!-- BEGIN id -->` / `<!-- END id -->` preamble/postamble into the compiled module. Whatever env the
build boots under (development in a local `pnpm views`, which sets the flag in
`config/environments/development.ts`) decides the output for every env that later renders it, test included.

Rails decides it in the running process: `ActionView::Template#compile` consults
`ActionView::Base.annotate_rendered_view_with_filenames` (via the ERB handler) when the template is
compiled, so a test process never annotates even if development does.

trailmap had to strip the comments in `test/views/status-badge.test.ts` (`withoutAnnotations`) to
pass after a local dev build. That strip is the workaround this story removes.

Expected shape: the precompiled module emits the annotation conditionally on the flag read at
render time (or the build emits both and the runtime picks), so the env that renders decides.

## Acceptance criteria

- A view precompiled under an env with the flag on renders without BEGIN/END comments in a process where the flag is off, and with them where it is on.
- A trails test covers both directions.
- trailmap's `withoutAnnotations` strip can be deleted (follow-up in trailmap once re-vendored).
