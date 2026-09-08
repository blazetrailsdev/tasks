---
title: "actionview-dependency-tracker-ruby-tracker-and-render-parser-are-unported"
status: draft
updated: 2026-09-08
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

PR for `actionview-digestor-is-a-stub-not-a-dependency-tree-digest` ported
`ActionView::Digestor`, `DependencyTracker`, `DependencyTracker::ERBTracker`
(as `TSETracker`) and `DependencyTracker::WildcardResolver`. It deliberately
left `DependencyTracker::RubyTracker`
(`vendor/rails/actionview/lib/action_view/dependency_tracker/ruby_tracker.rb`)
and the `RenderParser` family it depends on unported:

- `vendor/rails/actionview/lib/action_view/render_parser.rb` (40 LOC)
- `vendor/rails/actionview/lib/action_view/render_parser/prism_render_parser.rb` (139 LOC)
- `vendor/rails/actionview/lib/action_view/render_parser/ripper_render_parser.rb` (350 LOC)

`RubyTracker#render_dependencies` (`ruby_tracker.rb:26-34`) compiles the
template through its handler and hands the compiled source to
`RenderParser::Default#render_calls`. Both Rails parsers are Ruby-AST based
(Prism / Ripper); trails has no equivalent, so the port needs a decision on
what parses the compiled TS a handler emits.

Because `ruby_tracker.rb` has no TS file of its own, `parity:api` falls its
methods back onto `dependency-tracker/tse-tracker.ts`
(`ruby_tracker.rb ↦ dependency-tracker/tse-tracker.ts`), which is why that
file carries `render_dependencies call` / `render_dependencies new` rows in
`scripts/api-compare/call-mismatches-exclude/actionview/dependency-tracker/tse-tracker.json`.
Porting `RubyTracker` into its own `dependency-tracker/ruby-tracker.ts`
retires those two rows.

## Acceptance criteria

- [ ] `DependencyTracker::RubyTracker` ported to
      `packages/actionview/src/dependency-tracker/ruby-tracker.ts`, with
      `call` / `dependencies` / `supportsViewPaths` and the private
      `renderDependencies` / `explicitDependencies` pair.
- [ ] A `RenderParser` port (or a documented, filed decision on what stands in
      for Prism/Ripper) backs `renderDependencies`.
- [ ] The `render_dependencies call` and `render_dependencies new` rows are
      deleted from
      `scripts/api-compare/call-mismatches-exclude/actionview/dependency-tracker/tse-tracker.json`.
