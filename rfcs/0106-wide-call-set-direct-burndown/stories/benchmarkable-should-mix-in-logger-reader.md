---
title: "benchmarkable-should-mix-in-logger-reader"
status: claimed
updated: 2026-08-22
rfc: "0106-wide-call-set-direct-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-08-22T18:19:59Z"
assignee: "benchmarkable-should-mix-in-logger-reader"
blocked-by: null
closed-reason: null
---

## Context

`packages/activesupport/src/benchmarkable.ts` ports
`ActiveSupport::Benchmarkable#benchmark`
(`vendor/rails/activesupport/lib/active_support/benchmarkable.rb:36-51`) as a
shared free function whose FIRST parameter is the logger, rather than as a
module mixin reading the host's `logger` reader (`benchmarkable.rb:38,44,46`).

Rails' shape is `module Benchmarkable; def benchmark(message = "Benchmarking",
options = {}, &block)` — no logger parameter; the body calls `logger` three
times. trails has a settled idiom for Ruby `include`: `include()` / `Included<>`
from `@blazetrails/activesupport`, or a `this`-typed function assigned to the
class (CLAUDE.md "Module mixins"). So this is not a TypeScript language
shortcoming.

The deviation is currently recorded as a `@missingRailsCall logger —
CONVERGEABLE` tag at `packages/activesupport/src/benchmarkable.ts` (minted by
`wave-5b-tail-sweep`, migrated out of
`scripts/api-compare/call-mismatches-exclude/activesupport/benchmarkable.json`).

Callers today: `ActiveRecord::Base.benchmark` and the actionpack
`AbstractController`/`Logger` wrapper, both of which pass the logger in.

## Acceptance criteria

- [ ] `benchmark` is a `this`-typed mixin function over a `Benchmarkable` host
      exposing `logger`, matching `benchmarkable.rb`'s parameter list
      (`message = "Benchmarking"`, `options = {}`, block) with no logger param.
- [ ] Both call sites are converted to mix it in rather than pass a logger.
- [ ] The `@missingRailsCall logger` tag is deleted, not reworded.
- [ ] `pnpm parity:api:calls`, `parity:api:calls:args`, `parity:api:reasons`,
      `parity:api:detached` green.
