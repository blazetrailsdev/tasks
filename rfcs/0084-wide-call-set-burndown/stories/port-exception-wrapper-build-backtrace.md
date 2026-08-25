---
title: "port-exception-wrapper-build-backtrace"
status: closed
updated: 2026-08-11
rfc: "0084-wide-call-set-burndown"
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
closed-reason: "out of scope: targets actionpack; project focus is activerecord and its dependencies (activemodel, activesupport, arel, adapters)"
---

## Context

`ExceptionWrapper#build_backtrace`
(vendor/rails/actionpack/lib/action_dispatch/middleware/exception_wrapper.rb:254-275)
walks `ActionView::PathRegistry.all_resolvers` to collect `built_templates`,
then maps `@exception.backtrace_locations` onto
`SourceMapLocation.new(thread_backtrace_location, built_methods[...])` for the
frames that belong to a compiled template.

trails' `buildBacktrace`
(`packages/actionpack/src/action-dispatch/middleware/exception-wrapper.ts:297-299`)
is `return this.traces;` — the registry walk, the `built_methods` map, and the
`SourceMapLocation` construction are all absent. The existing call-site comment
already says so ("that registry isn't ported yet").

Surfaced by `audit-constructor-idiom-cluster-reasons` (RFC 0084): the row was
carrying a "constructor idiom — the construction is present in the port" reason
that is false.

## Acceptance criteria

- Either port `ActionView::PathRegistry.all_resolvers` / `built_templates` and
  `SourceMapLocation`, and give `buildBacktrace` the Rails body — or, if the
  registry is genuinely out of scope, block this story with the specific
  blocker rather than re-reasoning the baseline row.
- The `build_backtrace` row is DELETED from
  `scripts/api-compare/call-mismatches-exclude/actiondispatch/middleware/exception-wrapper.json`
  by hand on convergence (only-shrink, `serializeBaseline`).
