---
title: "Tse emitter keeps block-expression code verbatim so translate_location anchors it"
status: draft
updated: 2026-09-26
rfc: "0140-actionview-rendering-core"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Erubi's ActionView subclass emits a block expression's code verbatim:
`src << " " << code` when `BLOCK_EXPR` matches
(`vendor/rails/v8.0.2/actionview/lib/action_view/template/handlers/erb/erubi.rb:47-61`). So
`ERB::Util.tokenize`'s CODE token for a `<%= form_with do %>` line appears in the compiled source,
and `translate_location` (`template/handlers/erb.rb:43-59`) can anchor an error on that line.

trails' tse emitter (`packages/tse-compiler/src/emit-js.ts`, the `blockExpr` branch of `emit()`)
takes several liberties with block tags:

- it trims the tag body,

- it strips the trailing `{`,

- it inserts `context.capture(() => {`,

- it rewrites the closing `<% }) %>` tag.

The CODE token of those lines therefore never matches the compiled snippet, and `translateLocation`
returns null for an error raised on a block-expression line. trails#8158 made plain `<%= %>` / `<% %>`
tags keep their same-line whitespace. The parser (`packages/tse-compiler/src/parser.ts`) still
drops whitespace that crosses a newline inside a tag, where Erubi keeps the body verbatim.

## Acceptance criteria

- A block-expression line's tokenized CODE appears verbatim in the compiled line, so an error raised

  there is translated to its template column.

- Tag bodies keep newline-crossing whitespace as Erubi does, with line mapping preserved.

- `tse-translate-location.test.ts` covers a raising block-expression line.
