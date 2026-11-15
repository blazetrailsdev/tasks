---
title: "ruby-compat $stdout answers IO#puts so vite-assets IO.capture defaults to it"
status: draft
updated: 2026-11-15
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ViteRuby::IO.capture` defaults `with_output: $stdout.method(:puts)`
(`vendor/vite_ruby/v3.11.1/vite_ruby/lib/vite_ruby/io.rb:10`). ruby-compat's
`$stdout` is a `StdStream`, which has no `puts`. So
`packages/vite-assets/lib/io.ts` defaults to `STDOUT.puts` instead, which is a
different object from Ruby's reassignable `$stdout`.

## Acceptance criteria

- ruby-compat's `$stdout` answers `IO#puts` (and `sync`/`sync=`) as an IO
  does, with a test.
- `io.ts` defaults `withOutput` to `$stdout.puts`, which is Rails' shape.
