---
title: "call-args-pairs-string-new-with-rbstrsnew-in-mixed-new-bodies"
status: draft
updated: 2026-10-20
rfc: "0193-small-gem-ports-parity-100"
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
closed-reason: null
---

## Context

`scripts/api-compare/call-mismatches-exclude/rack/multipart/parser.json` baselines a `new` args row for `on_mime_head`. Rails `vendor/rack/v3.1.14/lib/rack/multipart/parser.rb:161-164` makes two `new` calls: `String.new`, with no arguments, and `klass.new(body, head, filename, content_type, name)`. The port `packages/rack/src/multipart/parser.ts` `onMimeHead` writes `rbStrSNew()` and `new klass(...)`. The args comparer pairs Ruby's argument-less `String.new` with the port's only `new` expression. `isCoreNewWithNoNewExpression` (`scripts/api-compare/compare.ts:~863`) credits `string-new` only when EVERY `new` site in the body is `String.new`, so a mixed body is never credited. `scripts/parity/ruby-compat.ts:137` already maps `String.new` to `rbStrSNew` by receiver.

## Acceptance criteria

- [ ] The call-args extractor takes a `String.new` site (`core_new_kind` `string-new`) that the TS body ports as `rbStrSNew(...)` out of the `new` pairing, so the remaining `klass.new` pairs with `new klass(...)`.
- [ ] The rack `multipart/parser.json` shard row is deleted, and no other shard row goes stale or new.
