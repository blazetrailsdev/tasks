---
title: "Port RenderParser and RubyTracker once a handler registers them"
status: draft
updated: 2026-09-08
rfc: "0140-actionview-rendering-core"
cluster: null
packages:
  - "actionview"
deps: []
deps-rfc: []
est-loc: 400
priority: 90
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

**This story is deliberately gated and must not be claimed until it has a
reader.** It is filed so the analysis is not re-derived, not so it is scheduled.

`RenderParser` (`render_parser.rb` 3 methods, `render_parser/prism_render_parser.rb`
3, `render_parser/ripper_render_parser.rb` 33) and
`dependency_tracker/ruby_tracker.rb` (9) are the compile-then-parse arm of
dependency tracking. `RubyTracker#render_dependencies` calls
`template.handler.call(template, template.source)` to get compiled Ruby, then
hands it to `RenderParser::Default` to walk for `render` / `render_to_string`
call nodes.

**Nothing in actionview registers `RubyTracker`.** `dependency_tracker.rb:38`
registers `ERBTracker` and nothing else; `RubyTracker` is opt-in surface for
gems whose handlers compile to Ruby. trails' default path is `TSETracker`
(`tse-tracker-ports-the-erb-regex-tracker`), which needs no parser at all.

So the gate on this story is: **a trails handler exists that compiles to code
the regex tracker cannot scan.** The likely first candidate is
`port-html-builder-and-ruby-template-handlers` (RFC 0104, ready) — if the
builder handler ships and needs digest tracking, this becomes real. Until then
it is an unread code path with a parser dependency attached, which is exactly
what `port-resolver-caching-and-cache-template-loading` was deliberately
deferred for.

## Converged shape

Settled in RFC 0140's Design section; do not re-derive:

- **Port `Base` and the Prism walker; do NOT port
  `render_parser/ripper_render_parser.rb`.** Its 350 lines exist only to serve
  `render_parser.rb:30-38`'s `begin require "prism" rescue LoadError` fallback.
  trails has one parser and no fallback condition, so `Default` binds
  unconditionally. Ripper takes a `SKIP_GROUPS` entry in
  `scripts/parity/conventions.ts` with that reason, so its 33 methods stop
  counting as missing.
- **Parse with `acorn`, not the TypeScript compiler API.** `compileJs`
  (`packages/tse-compiler/src/emit-js.ts:110`) emits plain JS —
  `export default function render(context, locals)`, no type annotations — so
  TS-awareness buys nothing and costs roughly 8MB in the runtime tree.
- **Load it behind a dynamic `import()`**, so a bundle that never registers
  `RubyTracker` drops the parser entirely.
- The node mapping from `PrismRenderParser`: `CallNode` -> `CallExpression`
  (callee `render` / `renderToString`), `StringNode#unescaped` -> string
  `Literal`, `InterpolatedStringNode` -> `TemplateExpression` with each `${}`
  becoming `"*"`, `KeywordHashNode`/`AssocNode`/`SymbolNode` ->
  `ObjectExpression`/`PropertyAssignment`/`Identifier`,
  `InstanceVariableReadNode` -> `this.x` member access, `LocalVariableReadNode`
  -> `Identifier`. The `ParenthesesNode` unwrap loop DOES port. The
  `ClassVariableReadNode` and `GlobalVariableReadNode` arms have no JS spelling
  and drop — say so at the site.
- Decide the file's name deliberately: `prism_render_parser.rb` is named after a
  gem trails does not use. Prefer a `RUBY_FILE_TS_OVERRIDES` entry over shipping
  `prism-render-parser.ts`.

## Acceptance criteria

- Not claimable until a registered `RubyTracker` reader exists; the claiming PR
  names it.
- `render_parser.rb`, `render_parser/prism_render_parser.rb` and
  `dependency_tracker/ruby_tracker.rb` report 0 missing.
- `render_parser/ripper_render_parser.rb` carries a `SKIP_GROUPS` entry with its
  reason and no longer counts as 33 missing methods.
- `SharedTrackerTests` (`vendor/rails/actionview/test/template/dependency_tracker_test.rb:63`)
  passes against both the TSE tracker and the parser-backed tracker, as Rails
  runs it against both.
- The parser is not in `actionview`'s eager import graph — verified by a
  plain-node import of the built `dist/` entry.
