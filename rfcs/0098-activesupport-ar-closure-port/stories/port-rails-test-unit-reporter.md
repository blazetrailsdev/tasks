---
title: "port-rails-test-unit-reporter"
status: closed
updated: 2026-08-14
rfc: "0098-activesupport-ar-closure-port"
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
closed-reason: "Won't-do: maintainer decision 2026-08-14 — minitest stays unported. Rails::TestUnitReporter subclasses Minitest::ProgressReporter, whose base class PR #6537 removed; there is nothing to extend. Needs a fresh plan (vitest owns the run) if ever revisited."
---

# Port `Rails::TestUnitReporter`

## Context

`railties/lib/rails/test_unit/reporter.rb` (121 lines) is a
`Minitest::ProgressReporter` subclass, and the reporter
`Minitest.plugin_rails_init` swaps `ProgressReporter` for at
`railties/lib/minitest/rails_plugin.rb:129-131`.

`port-minitest-reporter-surface` landed the base it needs —
`Minitest::ProgressReporter` (minitest.rb:759-771) and its `Reporter` /
`AbstractReporter` parents — in
`packages/activesupport/src/testing/assertions.ts`, along with the `IO`,
`Options` and `Reportable` duck types a reporter reads.

Unlike the rest of the reporter stack this one IS a Rails file, so it maps
under the trailties libPath (`railties/lib/rails`) and belongs at
`packages/trailties/src/test-unit/reporter.ts` — no `@noRailsEquivalent` needed
and `parity:api` should credit it.

`#format_rerun_snippet` / `#relative_path_for` use `Rails::TestUnitReporter.executable`
and `Rails.root`; keep the Rails names, and route any working-directory read
through `@blazetrails/activesupport`'s `process-adapter` (`cwd()`) rather than
`process.*`.

## Acceptance criteria

- [ ] `Rails::TestUnitReporter` is ported at
      `packages/trailties/src/test-unit/reporter.ts`, method for method against
      `rails/test_unit/reporter.rb`.
- [ ] The Rails test `railties/test/test_unit/reporter_test.rb` is ported
      alongside it with test names matching Rails verbatim.
- [ ] No `node:*` imports, no `process.*`.
