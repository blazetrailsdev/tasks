---
title: "remove-minitest-reporter-surface"
status: done
updated: 2026-08-14
rfc: "0098-activesupport-ar-closure-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6547
claim: "2026-08-14T21:41:01Z"
assignee: "converge-activesupport-module-deprecator-and-gem-version"
blocked-by: null
closed-reason: null
---

# Remove the minitest reporter surface from activesupport

## Context

Maintainer decision (2026-08-14): trails does not port the minitest gem.

`packages/activesupport/src/testing/assertions.ts` accreted minitest surface
one passenger at a time — `Minitest::Assertion` arrived with #6454 because
Rails' `ActiveSupport::Testing::Assertions` raises it, and each later addition
reused the same `@noRailsEquivalent PERMANENT` reason ("the minitest gem has no
vendored Rails file for the comparator to map onto"). #6525 escalated that from
error classes to the gem's whole reporter stack — `AbstractReporter`,
`Reporter`, `ProgressReporter`, `StatisticsReporter`, `SummaryReporter`,
`CompositeReporter`, `Skip`, `UnexpectedWarning`, the `Reportable` / `Options` /
`IO` shapes and the `Minitest.reporter` / `Minitest.clock_time` seat members
(minitest.rb:596-1030). No trails code outside that file and its own test uses
any of it; vitest owns the run.

Every other upstream dependency (rack, globalid, i18n, did_you_mean, date) was
an explicit decision with its own `packages/<name>`. minitest never was.

## Acceptance criteria

- [ ] #6525's port is reverted: the reporter stack, `Skip`,
      `UnexpectedWarning`, the reporter-only `Minitest` seat members, their
      barrel exports in `activesupport/src/index.ts`, and
      `testing/minitest-reporter.trails.test.ts`.
- [ ] The minitest classes ActiveSupport itself raises and rescues
      (`Assertion`, `UnexpectedError`, `BacktraceFilter`, the `Minitest`
      backtrace-filter seat) stay — `assert_nothing_raised` and
      `error_reporter_assertions.rb:45` need them.
- [ ] `pnpm parity:api` / `pnpm parity:api:extra` deltas non-negative.
