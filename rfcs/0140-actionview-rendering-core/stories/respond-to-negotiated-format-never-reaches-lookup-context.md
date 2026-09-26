---
title: "respond-to-negotiated-format-never-reaches-lookup-context"
status: ready
updated: 2026-09-26
rfc: "0140-actionview-rendering-core"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 6
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `respond_to` (`vendor/rails/actionpack/lib/action_controller/metal/mime_responds.rb:211-225`)
negotiates a `Mime::Type` (`collector.negotiate_format(request)`) and hands it
to `_process_format(format)`. `ActionView::Rendering#_process_format`
(`vendor/rails/actionview/lib/action_view/rendering.rb:146-149`) then narrows
the lookup context: `lookup_context.formats = [format.to_sym] if format.to_sym`.

trails diverges on both sides:

- `Collector#negotiateFormat`
  (`packages/actionpack/src/action-controller/metal/mime-responds.ts:57-75`)
  strips the Symbol to a bare name (`symbolToS(request.format.symbol)`) and
  returns `resolvedFormat`, a bare string (`"html"`), not a `Mime::Type`.
- `ActionView::Rendering#_process_format` is not ported: `respondTo` calls the
  abstract no-op `_processFormat` (`abstract-controller/rendering.ts:101`), so
  the negotiated format never reaches `LookupContext#formats=`.

Since `back-template-types-with-the-mime-registry` (trails#8129), LookupContext
formats are colon-spelled Symbols (`":html"`) validated against
`Template::Types` (= `Mime`). Porting `_process_format` over today's bare
`resolvedFormat` would raise `Invalid formats: html`, so the two halves must
converge together.

## Acceptance criteria

- `Collector#negotiateFormat` returns the negotiated `MimeType`, as
  `collector.rb`'s `negotiate_format` does; no `symbolToS` flattening.
- `ActionView::Rendering#_process_format` is ported (`super`, then
  `lookup_context.formats = [format.to_sym] if format.to_sym`) and mixed into
  the controller, so `respond_to`'s negotiated format narrows template lookup.
- A cover: a `respond_to` block with `format.json` renders the `.json`
  template when both `.html` and `.json` templates exist.
