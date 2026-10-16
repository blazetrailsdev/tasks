---
title: "SyntaxErrorProxy::BacktraceLocation answers its to_s member through toString"
status: draft
updated: 2026-10-16
rfc: "0165-actiondispatch-middleware-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActiveSupport::SyntaxErrorProxy::BacktraceLocation < Struct.new(:path, :lineno, :to_s)`
(`vendor/rails/v8.0.2/activesupport/lib/active_support/syntax_error_proxy.rb:15-21`)
answers its third member through `to_s`, so `loc.to_s` is the trace line. trails'
`BacktraceLocation` (`packages/activesupport/src/syntax-error-proxy.ts`, ported on
trails#8966) stores it as a public `toS` field, so `String(loc)` answers
`[object Object]` and a reader of `toString()` (as ruby-compat `Location`
offers, `packages/ruby-compat/src/backtrace-location.ts`) misses it.

## Acceptance criteria

- `BacktraceLocation`'s third member is read through `toString()`, as Ruby's
  `to_s`; no `toS` member remains.
- `syntax-error-proxy.trails.test.ts` asserts `String(first)` is the trace line.
