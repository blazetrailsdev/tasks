---
title: "record-ruby-call-receiver-hints"
status: done
updated: 2026-09-01
rfc: "0129-ruby-compat"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 260
priority: 36
pr: 7334
claim: "2026-09-01T13:01:27Z"
assignee: "record-ruby-call-receiver-hints"
blocked-by: null
closed-reason: null
---

## Context

`scripts/parity/ruby-compat.ts` (#7294) can only admit a Ruby-core → ruby-compat
row when the bare method name is unambiguous across receivers, because the
comparator cannot recover a receiver at all:

- `scripts/api-compare/extract-ruby-api.rb` `collect_method_calls` records a
  body's calls as NAMES, with one receiver signal beside them — the
  inert-receiver `weakCalls` subset (RFC 0083).
- the TS side has only `FOREIGN_READ_PREFIX` (`enumerable-idioms.ts`).

Neither distinguishes `options.fetch` from `cache.fetch`, so nine real
ruby-compat exports sit in `AMBIGUOUS_RUBY_CALLS` rather than in the table:
`Hash#fetch`, `Hash#merge`, `Hash#merge!`, `Hash#update`, `Hash#slice`,
`Hash#except`, `Hash#reject`, `String#succ`, `Symbol#to_s`.

**The cost is measured, not hypothetical.** Those exclusions hold back 43 live
call-mismatch rows — `fetch` 14, `merge` 16, `merge!` 13 — against a reverse
population of 14. Spot-checking every one of the 43, each is in fact a Hash
receiver, so the rule is costing real signal; it is still correct today because
nothing in the artifact can _prove_ the receiver per row.

The unlock is a receiver hint on the Ruby side. Ripper gives the receiver node
at each call site (`walk_for_calls` already inspects it to classify a call as
weak), so recording a coarse receiver kind — literal Hash, `self`, a local, a
constant — beside each call name would let the table admit rows keyed on it and
move the excluded nine out of `AMBIGUOUS_RUBY_CALLS`.

## Acceptance criteria

- `extract-ruby-api.rb` records a receiver hint per call, alongside the existing
  name and `weakCalls` classification, in a form `compare.ts` can read.
- `rubyCompatExport` consults it, so a row keyed `Hash#fetch` credits/flags only
  a Hash-receiver `fetch`.
- Members leave `AMBIGUOUS_RUBY_CALLS` as they become resolvable; the map only
  shrinks.
- `pnpm parity:api:calls` and `parity:api:calls:args` unchanged; the reverse
  population of `parity:api:calls:ruby-compat:report` is reported before/after.
