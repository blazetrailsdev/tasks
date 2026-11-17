---
title: "Call-order: a lambda argument to new is read as a deferred block (rack Files#initialize)"
status: draft
updated: 2026-11-17
rfc: "0156-parity-beyond-name-presence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Found while working on `call-order-counts-option-property-read-as-call` (dropped from trails#10241). Ruby's `Rack::Files#initialize` (`vendor/rack/*/lib/rack/files.rb:27-32`) runs `@head = Rack::Head.new(lambda { |env| get env })`. The lambda is an ARGUMENT, so the Ruby order stream records `get` before `new`. The TS port (`packages/rack/lib/files.ts:111`, `new Head((env) => this.get(env))`) has a function argument, which `collectCalls` in `scripts/api-compare/extract-ts-api.ts` (the `isNewExpression` branch, with `isFunctionArgument` treating every arrow argument as a block) defers past `constructor`. Once `BaseIterator`'s constructor (`files.ts:18-26`) stops contributing `options.mimeType` / `options.size` reads, the gate reports `files.ts initialize order:constructor,get`. Today it is masked only because the two constructors' sequences are not compared separately.

## Acceptance criteria

- The TS extractor tells a ported Ruby lambda argument apart from a Ruby block on `new` / call expressions, for example with a marker mirroring ruby-compat's `block()`. The rack row then does not appear once the options-read fix from `call-order-counts-option-property-read-as-call` lands.
- No baseline row is added for `files.ts initialize`.
