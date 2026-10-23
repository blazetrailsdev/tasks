---
title: "call-args: argument 1 of an Enumerable free function is the Ruby receiver and a trailing function is the block"
status: done
updated: 2026-10-22
rfc: "0194-ruby-compat-native-first"
cluster: gate
packages: ["ruby-compat"]
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: trails#9252
claim: "2026-10-22T21:01:45Z"
assignee: "call-args-drops-visibility-boolean-argument"
blocked-by: null
closed-reason: null
---

## Context

`parity:api:calls:args` drops argument 1 of a ruby-compat helper as the
receiver only for the exports in `RECEIVER_KEYED_RUBY_COMPAT_EXPORTS`
(`scripts/api-compare/call-args.ts:567-575`, `:599-604`). The Enumerable free
functions (`enumerable-free-functions-over-iterable`) are called as
`partition(xs, fn)` for Ruby `xs.partition { }`, so the argument gate would
read two TS arguments against Ruby's zero and file a `shape` row. The call-set
gate credits the name already, but only through the naming convention.

## Acceptance criteria

- [ ] A table `ENUMERABLE_FREE_FUNCTIONS` in `scripts/parity/ruby-compat.ts` maps `Enumerable#<m>` to the free-function export. It is read like a receiver-keyed row whose receiver can be any kind, because Enumerable is mixed into every receiver.
- [ ] In `call-args.ts` the first TS argument of such a call is the Ruby receiver, and a trailing function argument is the Ruby block (`&blk` / `{ }`). Neither counts against Ruby's argument list.
- [ ] Tests: `partition(xs, fn)` vs `xs.partition(&:x)` is no row, `eachSlice(xs, 2, fn)` vs `xs.each_slice(2) { }` is no row, and `eachSlice(xs, 3, fn)` vs `each_slice(2)` is a `shape` row.
- [ ] `pnpm parity:api:calls:args` is green.
