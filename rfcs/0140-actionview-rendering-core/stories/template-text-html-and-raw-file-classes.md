---
title: "Port Template::Text, Template::HTML, Template::RawFile, Inline and Renderable"
status: in-progress
updated: 2026-09-09
rfc: "0140-actionview-rendering-core"
cluster: null
packages:
  - "actionview"
deps: []
deps-rfc: []
est-loc: 300
priority: 20
pr: 7636
claim: "2026-09-09T01:49:11Z"
assignee: "template-text-html-and-raw-file-classes"
blocked-by: null
closed-reason: null
---

## Context

Five small template classes are absent, 26 methods between them. They are the
non-file template representations — what `render plain:`, `render html:`,
`send_file` and inline rendering produce instead of a resolved `.tse` file:

| Ruby                        | Methods |
| --------------------------- | ------- |
| `template/text.rb`          | 7       |
| `template/raw_file.rb`      | 7       |
| `template/html.rb`          | 6       |
| `template/renderable.rb`    | 4       |
| `template/inline.rb`        | 1       |
| `template/handlers/html.rb` | 1       |

They matter for this RFC because actionpack's renderers reach them directly —
`action_controller/metal/renderers.rb` and `rendering.rb` construct
`ActionView::Template::Text` and `::HTML` for the `plain:` and `html:` options,
and a large share of actionpack's `render_test.rb` gap exercises exactly those
options.

Each is a duck-typed stand-in for `Template`: they answer `identifier`,
`render`, `format`, `type` and `to_str`-shaped members without going through
`Handlers` or `Resolver`. Read all five in the vendored source before porting —
they are individually trivial and collectively easy to get subtly wrong, because
which members each one answers differs.

`template/handlers/builder.rb` is NOT in this story; it belongs to
`port-html-builder-and-ruby-template-handlers` (RFC 0104, ready).

## Converged shape

One TS file per Ruby file, at the converted paths under
`packages/actionview/src/template/`. `Renderable` is a module in Ruby and takes
the repo's module-mixin idiom.

## Acceptance criteria

- All six Ruby files above report 0 missing in
  `pnpm parity:api --package actionview`.
- `Template::Text#render` returns its string and `#format` answers `:text`;
  `Template::HTML` answers `:html` and marks its output html-safe.
- `Template::RawFile` reports the file's `identifier` without reading it through
  a handler.
- `pnpm parity:api:extra --package actionview` reports no new untagged name.
