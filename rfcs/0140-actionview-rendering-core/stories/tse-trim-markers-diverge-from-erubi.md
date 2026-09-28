---
title: "TSE <%- / -%> trim anywhere; Erubi trims only whole-line statements"
status: draft
updated: 2026-09-28
rfc: "0140-actionview-rendering-core"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails compiles ERB with Erubi in `trim: true` mode
(`vendor/rails/v8.0.2/actionview/lib/action_view/template/handlers/erb.rb`, `erb_trim_mode = "-"`,
handed to `Erubi::Engine` as `trim:`). Erubi 1.13.1 trims only a statement tag that is
alone on its line (leading whitespace and trailing newline); a `-` on a statement tag is
otherwise ignored, and a `-%>` on an expression tag drops only the newline right after it.
Checked with the erubi gem:

- `<% content_for :title do %>title<% end -%>\n` keeps the `\n` after `end -%>`.
- `<%- provide :header do -%>Yes, <%- end -%>\n` keeps `"Yes, "` (trailing space) and the `\n`.

trails' tse-compiler lexer (`packages/tse-compiler/src/lexer.ts:78-86`) implements
`<%-` as "strip spaces/tabs before the tag" and `-%>` as "eat the following newline"
wherever the tag sits. So `Yes, <%- }) -%>\n` renders `Yes,` with no newline.

Found porting `streaming_render_test.rb` (`packages/actionview/src/renderer/streaming-render.test.ts`),
whose fixtures had to be rewritten with Erubi's effective markup instead of Rails' literal
`<%-` / `-%>` to get Rails' output.

## Acceptance criteria

- `<%-` / `-%>` in TSE follow Erubi `trim: true` semantics: a statement alone on its line is
  trimmed with or without dashes, a mid-line statement is not trimmed, and an expression's
  `-%>` drops only the following newline.
- The streaming-render fixtures use Rails' literal trim markers (`vendor/rails/v8.0.2/actionview/test/fixtures/test/streaming.erb` etc.) and still pass.
