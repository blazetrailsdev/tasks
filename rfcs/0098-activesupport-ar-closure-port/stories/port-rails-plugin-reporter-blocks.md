---
title: "Port plugin_rails_init's three reporter blocks (rails_plugin.rb:122-135)"
status: closed
updated: 2026-08-14
rfc: "0098-activesupport-ar-closure-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 220
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Won't-do: maintainer decision 2026-08-14 — minitest stays unported. rails_plugin.rb:122-135 operates on Minitest.reporter/SummaryReporter/ProgressReporter, all removed by PR #6537 and not returning. Needs a fresh plan (vitest owns the run) if ever revisited."
---

# Port `plugin_rails_init`'s three reporter blocks

## Context

PR #6499 ported `Minitest.plugin_rails_init`'s backtrace-filter arm at
`packages/trailties/src/minitest/rails-plugin.ts`, mirroring
`vendor/rails/railties/lib/minitest/rails_plugin.rb:111-120`. The method's other
three blocks (`rails_plugin.rb:122-135`) are unported and carry a
`@missingRailsCall` at the call site:

```ruby
if reporter.reporters.reject! { |reporter| reporter.kind_of?(SummaryReporter) }
  reporter << SuppressedSummaryReporter.new(options[:io], options)
end
if reporter.reporters.reject! { |reporter| reporter.kind_of?(ProgressReporter) }
  reporter << ::Rails::TestUnitReporter.new(options[:io], options)
end
if options[:profile]
  reporter << ProfileReporter.new(options[:io], options)
end
```

They need `Minitest.reporter` / `CompositeReporter` plus
`SuppressedSummaryReporter` (rails_plugin.rb:21-26), `ProfileReporter`
(:28-... ) and `Rails::TestUnitReporter`
(`railties/lib/rails/test_unit/reporter.rb`), none of which trails has — vitest
owns reporting.

Rails' tests for these arms are
`railties/test/minitest/rails_plugin_test.rb:46-71` ("replaces
Minitest::SummaryReporter reporter", "replaces Minitest::ProgressReporter
reporter", "keeps non-default reporters", "does not add reporters when not
replacing reporters"), which the trails port file
(`packages/trailties/src/minitest/rails-plugin.test.ts`) currently omits.

## Converged shape

Port the reporter surface Rails names (or block with the specific finding that
vitest's reporter model admits no receiver), then port the three blocks and
delete the `@missingRailsCall` on `pluginRailsInit`, and add the four Rails
tests under their verbatim names.

## Acceptance criteria

- [ ] `pluginRailsInit` runs all of rails_plugin.rb:112-135, or the story is
      blocked with the specific blocker.
- [ ] The `@missingRailsCall` tag on `pluginRailsInit` is deleted.
- [ ] `rails_plugin_test.rb:46-71`'s four reporter tests are ported verbatim.
