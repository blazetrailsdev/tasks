---
title: "port-minitest-rails-plugin-reporter-subclasses"
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
closed-reason: "don't want minitest"
---

# Port `Minitest::SuppressedSummaryReporter` and `Minitest::ProfileReporter`

## Context

`port-minitest-reporter-surface` landed the minitest gem reporter base classes
in `packages/activesupport/src/testing/assertions.ts` —
`AbstractReporter` (minitest.rb:687-731), `Reporter` (:733-751),
`ProgressReporter` (:759-771), `StatisticsReporter` (:795-878),
`SummaryReporter` (:897-967), `CompositeReporter` (:969-1024), plus the
`Minitest.reporter` seat (minitest.rb:51) and `Minitest.clockTime`
(:1214-1222), the `IO` / `Options` / `Reportable` duck types, and the `Skip` /
`UnexpectedWarning` failure classes.

Still unported, both defined in `railties/lib/minitest/rails_plugin.rb` and
both needed before the three reporter-swap blocks at rails_plugin.rb:122-135
can be ported:

- `Minitest::SuppressedSummaryReporter` (rails_plugin.rb:21-26) — a
  `SummaryReporter` subclass overriding `#aggregated_results` to print nothing
  unless `options[:verbose]`.
- `Minitest::ProfileReporter` (rails_plugin.rb:28-65) — a `Reporter` subclass
  keeping the `options[:profile]` slowest results; its `#report` uses `Dir.pwd`
  and `Pathname`, which the trailties hard rules bar (NO `process.*`) — route
  through `@blazetrails/activesupport`'s `process-adapter` `cwd()` the way
  `assertions.ts`'s `baseRe()` does.

Both belong in `packages/trailties/src/minitest/rails-plugin.ts`, next to
`BacktraceFilterWithFallback`, and carry the same
`@noRailsEquivalent CONVERGEABLE` libPath note that file's existing classes do
(tracked by `widen-trailties-libpath-to-cover-lib-minitest`).

## Acceptance criteria

- [ ] `SuppressedSummaryReporter` and `ProfileReporter` are ported into
      `packages/trailties/src/minitest/rails-plugin.ts`, over the activesupport
      base classes.
- [ ] No `node:*` imports, no `process.*` — `Dir.pwd` goes through
      `process-adapter`'s `cwd()`.
- [ ] Tests cover the `options[:verbose]` arm of `#aggregated_results` and the
      `#report` ordering/`count` slice of `ProfileReporter`.
