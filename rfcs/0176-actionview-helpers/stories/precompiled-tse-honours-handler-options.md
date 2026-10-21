---
title: "Precompiled TSE stand-in honours Tse handler options (annotate filenames, trim, strip newlines)"
status: ready
updated: 2026-10-21
rfc: "0176-actionview-helpers"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: 8
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Tse#call` (`packages/actionview/src/template/handlers/tse.ts`, mirroring `vendor/rails/v8.0.2/actionview/lib/action_view/template/handlers/erb.rb` `call`) applies run-time handler configuration when it compiles: `escapeIgnoreList` (escape_ignore_list), `tseTrimMode` (erb_trim_mode), `stripTrailingNewlines` (strip_trailing_newlines), `tseImplementation` (erb_implementation), and `ActionView::Base.annotate_rendered_view_with_filenames`, which adds the `<!-- BEGIN/END <short_identifier> -->` preamble and postamble. Since trails#9149 the precompiled stand-in from `virtualizeTse` (`packages/trails-tsc/src/plugins/tse.ts`) honours only escape-ignore, and only for a `text` format segment in the file name. Trim mode is the parser default, and annotation, strip-trailing-newlines and a custom implementation are ignored. So a precompiled template renders differently from what Rails' `compile` produces under the same configuration.

## Acceptance criteria

- `build-views` takes the handler configuration (annotate filenames, trim mode, strip trailing newlines, escape-ignore types) and builds each stand-in exactly as `Tse#call` would compile it for that template's format and short identifier.
- `annotate_rendered_view_with_filenames` wraps a precompiled template's output in the BEGIN/END comments, as `erb.rb`'s `call` does.
- The test compiler takes the same options from the live `Tse` class attributes, so string templates and precompiled templates agree.
- Tests cover each option on the precompiled path.
