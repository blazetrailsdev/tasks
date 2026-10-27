---
title: "Port RubyTracker and converge TSETracker to erb_tracker.rb (scan-loop add_dependencies, LAYOUT_DEPENDENCY)"
status: draft
updated: 2026-10-27
rfc: "0176-actionview-helpers"
cluster: null
packages: ["actionview"]
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/actionview/src/dependency-tracker/tse-tracker.ts` mirrors
`dependency_tracker/erb_tracker.rb`, but its `renderDependencies` is RubyTracker's
option-parsing behaviour (`dependency_tracker/ruby_tracker.rb` plus
`render_parser.rb`): it rejects unknown options, finds `spacer_template`, and skips
commented-out renders. `template/dependency-tracker.test.ts` ports `RubyTrackerTests`
(`vendor/rails/v8.0.2/actionview/test/template/dependency_tracker_test.rb:273-320`)
against `TSETracker`. Rails' literal ERBTracker shape, `source.split(/\brender\b/)`
followed by `add_dependencies(deps, args, LAYOUT_DEPENDENCY)` and
`add_dependencies(deps, args, RENDER_ARGUMENTS)` with `arguments.scan(pattern)`
(`erb_tracker.rb:93-111`), fails those three RubyTracker tests. This was tried on
trails#9358. `addDependencies` therefore keeps an invented anchored-match `if`
(receipted `@inventedArm if — CONVERGEABLE` against this story). The
`PARTIAL_HASH_KEY`, `LAYOUT_HASH_KEY` and `LAYOUT_DEPENDENCY` constants are
unported.

## Acceptance

- Port `RubyTracker` (and the render parser it uses) into its own file mirroring
  `ruby_tracker.rb`, and run `RubyTrackerTests` against it.
- Converge `TSETracker` to `erb_tracker.rb` line for line: `render_dependencies`
  calls `add_dependencies` twice with `LAYOUT_DEPENDENCY` / `RENDER_ARGUMENTS`,
  `add_dependencies` is a scan loop, the hash-key constants are ported, and the
  `@inventedArm` receipt is removed.
- Port `PARTIAL_HASH_KEY`, `LAYOUT_HASH_KEY`, `LAYOUT_DEPENDENCY` and Rails'
  `RENDER_ARGUMENTS` (`erb_tracker.rb:31-64`) verbatim; layout and spacer
  dependencies go through `add_dependencies`, not bespoke `STRING.exec` blocks.
