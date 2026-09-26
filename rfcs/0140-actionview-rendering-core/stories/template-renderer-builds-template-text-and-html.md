---
title: "determineTemplate builds invented Body/Plain/HtmlTemplate instead of Template::Text/HTML"
status: in-progress
updated: 2026-09-26
rfc: "0140-actionview-rendering-core"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: 10
pr: trails#8156
claim: "2026-09-26T18:22:02Z"
assignee: "named-route-helpers-camelcase-multiword-names"
blocked-by: null
closed-reason: null
---

## Context

Rails' `ActionView::Renderer::TemplateRenderer#determine_template` builds
`Template::Text.new(options[:body])`, `Template::Text.new(options[:plain])`
and `Template::HTML.new(options[:html], formats.first)`
(`vendor/rails/actionview/lib/action_view/renderer/template_renderer.rb:17-24`).
Both classes are ported (`packages/actionview/src/template/text.ts`,
`template/html.ts`).

The async renderer (`packages/actionview/src/renderer/template-renderer.ts`)
builds invented private classes instead: `BodyTemplate`, `PlainTemplate`,
`HtmlTemplate`. They exist because `RenderableTemplate`
(`renderer/abstract-renderer.ts`) models `identifier` and `format` as
properties, while the ported `Text` / `HTML` expose them as methods (Ruby
`attr_reader`-shaped zero-arg methods). trails#8129 fixed `HtmlTemplate`'s
escaping but left the class.

## Converged shape

`determineTemplate` returns `new Text(...)` / `new HTML(...)`, and
`RenderableTemplate`'s `identifier` / `format` access is reconciled with the
ported template classes (one shape across `Template`, `Text`, `HTML`,
`RawFile`, `Inline`), so the three invented classes are deleted.

## Acceptance criteria

- `BodyTemplate`, `PlainTemplate`, `HtmlTemplate` are gone.
- `render body:/plain:/html:` render through `Template::Text` / `Template::HTML`,
  keeping the `render_html_test.rb:168-178` escape covers green.
