---
title: "Template#spot highlights to end of line instead of the failing node's span"
status: ready
updated: 2026-09-26
rfc: "0140-actionview-rendering-core"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: 20
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `Template#spot` (`actionview/lib/action_view/template.rb:231-246`) finds
the AST node for the backtrace location's `node_id` and returns
`ErrorHighlight.spot(node)` — a span covering exactly the failing call
(`first_column`..`last_column` of the node).

trails' `Template#spot` (`packages/actionview/src/template.ts`) has no AST: it
returns the whole compiled line with `lastColumn` at the end of the line, so the
exception page highlights from the error column to end-of-line (see
`packages/actionpack/src/action-dispatch/dispatch/exception-wrapper.trails.test.ts`,
whose line-2 extract is `["<%= [].boom.", "length %>\n", ""]` where Rails would
isolate `length`).

## Converged shape

`spot` parses the compiled source (TypeScript's parser is already a dependency
through `typescript/unstable/*`) and answers the span of the innermost
expression at the location's column, as `ErrorHighlight.spot` does.

## Acceptance criteria

- The exception-wrapper cover's extract splits line 2 as `["<%= [].boom.", "length", " %>\n"]`.
- Remove the `@missingRailsCall parse` receipt on `Template#spot` if the port calls a parse.
