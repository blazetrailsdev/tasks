---
title: "build-views precompiles .builder templates"
status: claimed
updated: 2026-10-22
rfc: "0176-actionview-helpers"
cluster: null
packages: ["trails-tsc", "actionview"]
deps: ["port-builder-gem-xml-markup"]
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: "2026-10-22T17:45:29Z"
assignee: "build-views-precompiles-builder-templates"
blocked-by: null
closed-reason: null
---

## Context

Split from `port-builder-gem-xml-markup`. `ActionView::Template::Handlers::Builder#call`
(`vendor/rails/v8.0.2/actionview/lib/action_view/template/handlers/builder.rb:8-14`)
compiles a `.builder` template to source that drives `::Builder::XmlMarkup`. Root
CLAUDE.md § "Templates are precompiled" says file-backed templates are precompiled
and shipped code has no eval pipeline, but `build-views`
(`packages/trails-tsc/src/build-views.ts`) only knows how to virtualize `.tse`
(`virtualizeTse`, `packages/trails-tsc/src/plugins/tse.ts`). A `.builder` file has
no emitted module, so `Template#compile` raises `LoadError` for it.

## Acceptance criteria

- `build-views` emits a typed module for a `.builder` template whose body is
  `Handlers::Builder#call`'s compiled source (`XmlMarkup.new(indent: 2, target: output_buffer.raw)`,
  the template source, `output_buffer.to_s`), with a source map back to the file.
- The test-time compiler (`packages/actionview/src/test-helpers/compile-template.ts`)
  builds the same stand-in for `.builder`.
- A `.builder` fixture renders through `Template#compile` from its emitted module.
