---
title: "Port Minitest::BacktraceFilter as a class with a settable Minitest.backtrace_filter"
status: done
updated: 2026-08-13
rfc: "0098-activesupport-ar-closure-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: 6495
claim: "2026-08-13T21:57:10Z"
assignee: "converge-fixtures-encrypted-attributes-present"
blocked-by: null
closed-reason: null
---

## Context

`packages/activesupport/src/testing/assertions.ts` ports minitest's backtrace
filtering as three module-private free functions — `MT_RE`, `filter`, and
`filterBacktrace` — landed by PR #6477 so `UnexpectedError#message` renders a
filtered trace (minitest.rb:1103-1107).

Minitest does not have free functions there. It has:

- `Minitest::BacktraceFilter` (minitest-6.0.6 lib/minitest.rb:1173-1199): a
  CLASS with `MT_RE = %r%lib/minitest|internal:warning%`, an `attr_accessor
:regexp`, `initialize(regexp = MT_RE)`, and `#filter(bt)`.
- `Minitest.backtrace_filter` (minitest.rb:43, assigned at :1204): a
  `cattr_accessor` holding the default `BacktraceFilter.new`, which
  `Minitest.filter_backtrace` (minitest.rb:365-369) reads.

So trails collapses a configurable object plus its module-level accessor into
two closed-over functions. Nothing can swap the filter, which is the whole point
of the `cattr_accessor` — Rails' own `active_support/testing/...` suites and
plugins reassign `Minitest.backtrace_filter`.

Second, smaller divergence in the same cluster: `MT_RE` is trails-authored
(`/node_modules[/\\]@?vitest|node:internal/`) rather than minitest's literal
`lib/minitest|internal:warning`. That one is forced — the frames being filtered
are vitest's, not minitest's — but it should ride on the ported class's
`regexp` default rather than being a bare const.

## Converged shape

Port `BacktraceFilter` as a class with the `regexp` accessor, `initialize`
default and `filter` method, plus the `Minitest.backtrace_filter` accessor
that `filter_backtrace` reads, keeping the trails-specific frame regexp as the
class's default `regexp` value with its reason at the call site.

## Acceptance criteria

- [ ] `BacktraceFilter` exists as a class with `regexp` and `filter`.
- [ ] `filterBacktrace` reads a settable `backtraceFilter`, not a closed-over
      function.
- [ ] `UnexpectedError#message` output is unchanged for the default filter
      (`unexpected-error.trails.test.ts` stays green).
- [ ] A test swaps the filter and asserts the rendered trace follows.
