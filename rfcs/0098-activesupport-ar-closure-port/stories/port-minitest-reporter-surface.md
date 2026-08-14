---
title: "port-minitest-reporter-surface"
status: done
updated: 2026-08-14
rfc: "0098-activesupport-ar-closure-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6525
claim: "2026-08-14T15:27:02Z"
assignee: "port-minitest-reporter-surface"
blocked-by: null
closed-reason: null
---

# Port the Minitest reporter surface `plugin_rails_init` swaps

## Context

`port-rails-plugin-reporter-blocks` is blocked on this: the three reporter
blocks at `vendor/rails/railties/lib/minitest/rails_plugin.rb:122-135` operate
on a receiver trails does not have.

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

Every name in those nine lines is absent from trails
(`grep -rn "SummaryReporter\|ProgressReporter\|CompositeReporter\|TestUnitReporter\|Minitest.reporter" packages/ --include=*.ts`
matches only the `@missingRailsCall` prose in
`packages/trailties/src/minitest/rails-plugin.ts:47-49`):

- **minitest gem** (`Minitest.reporter`, `Minitest::CompositeReporter` with
  `#reporters` / `#<<`, `Minitest::Reporter`, `Minitest::SummaryReporter`,
  `Minitest::ProgressReporter`). trails ports the minitest gem only in
  fragments — `Minitest::Assertion`, `UnexpectedError`, `BacktraceFilter` and
  the `Minitest.backtraceFilter` accessor in
  `packages/activesupport/src/testing/assertions.ts` — each carrying a
  `@noRailsEquivalent` because the gem sits outside every scanned libPath.
  The reporter stack is a much larger slice of that gem than anything ported
  so far, and it presupposes a run lifecycle (`record` / `report` / `start`)
  that vitest, not trails, owns.
- **`Minitest::SuppressedSummaryReporter`** (rails_plugin.rb:21-26) — trivial,
  but a `SummaryReporter` subclass, so it cannot land first.
- **`Minitest::ProfileReporter`** (rails_plugin.rb:28-65) — a `Reporter`
  subclass; its `#report` also wants `Dir.pwd` and `Pathname`, which the
  trailties hard rules bar (`NO process.*`).
- **`Rails::TestUnitReporter`**
  (`vendor/rails/railties/lib/rails/test_unit/reporter.rb`, 121 lines) — a
  `ProgressReporter` subclass.

That is well past one PR, and the ordering is strict: the gem base classes,
then the two rails_plugin.rb subclasses plus `Rails::TestUnitReporter`, then
the three blocks.

## Acceptance criteria

- [ ] `Minitest.reporter` exists as a `CompositeReporter` with `reporters` and
      the `<<` append (trails spelling per docs/ruby-ts-conventions.md), over
      ported `Minitest::Reporter` / `SummaryReporter` / `ProgressReporter`
      base classes.
- [ ] `Minitest::SuppressedSummaryReporter` (rails_plugin.rb:21-26) and
      `Minitest::ProfileReporter` (rails_plugin.rb:28-65) are ported into
      `packages/trailties/src/minitest/rails-plugin.ts`.
- [ ] `Rails::TestUnitReporter` (`rails/test_unit/reporter.rb`) is ported.
- [ ] Split across as many PRs as the ordering above needs; each stands alone
      from main.
- [ ] On landing, `port-rails-plugin-reporter-blocks` unblocks.
