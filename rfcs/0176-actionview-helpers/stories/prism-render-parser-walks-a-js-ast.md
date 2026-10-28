---
title: "prism-render-parser-walks-a-js-ast"
status: ready
updated: 2026-10-28
rfc: "0176-actionview-helpers"
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

`packages/actionview/src/render-parser/prism-render-parser.ts` (`PrismRenderParser#renderCalls`) finds render calls by masking string literals in the handler's compiled JS and matching `/\brender(?:ToString)?\b/`. Rails walks `Prism.parse(@code)` breadth-first, keyed on `CallNode#name` (`vendor/rails/v8.0.2/actionview/lib/action_view/render_parser/prism_render_parser.rb:5-35`). `render_call_template` switches on node type (`:79-96`). The port instead uses a single `READ_CHAIN` regex, so `render a.b(c).d` is dropped where Prism yields `d`. The module helpers `argumentList`, `isStringNode`, `unescaped`, `KEYWORD_PAIR` and `READ_CHAIN` exist only to stand in for the AST. `renderCalls` carries `@missingRailsCall parse — CONVERGEABLE` against this story. actionview has no runtime JS parser dependency today (`typescript` is a devDependency only).

## Acceptance criteria

- `renderCalls` walks a real JS AST of the compiled source (the parser choice is an owner decision: a new runtime dependency, or the compiler under `typescript/unstable/*`), dispatching on call-expression callee name `render` / `renderToString`.
- `renderCallOptions` and `renderCallTemplate` switch on node kinds as in `prism_render_parser.rb:40-133`; the regex helpers are deleted.
- The `@missingRailsCall parse` receipt is removed.
