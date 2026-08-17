---
title: "Call extractor pairs a nested class's member with its outer-class homonym"
status: closed
updated: 2026-08-17
rfc: "0025-fidelity-verification-tooling"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 180
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Superseded by precise-call-pairing-key-for-owner-static-and-accessor (2026-08-17 sweep): all five are one root cause — the <package,tsFile,rubyName> row key cannot name the member on either side. Every citation and baselined row from this story is carried into that body as an acceptance criterion."
---

## Context

Surfaced by PR #6603 (port `ActiveRecord::Relation::ExplainProxy`).

The call-set extractor keys a row by `<package, tsFile, rubyName>`. When a Rails
file declares a **nested class whose members are homonyms of the outer class's**,
both collapse onto one key and the nested member inherits the OUTER method's
Rails call set.

`vendor/rails/activerecord/lib/active_record/relation.rb` is the live instance:

- `ActiveRecord::Relation::ExplainProxy#first` (relation.rb:24-26) and
  `#last` (:28-30) are each a one-line `exec_explain { @relation.first(limit) }`
  / `{ @relation.last(limit) }`.
- `ActiveRecord::Relation#first` / `#last` (finder_methods.rb:100-108,
  :123-131) call `find_nth`, `find_nth_with_limit`, `find_last`, `limit`.

Because both live in `relation.ts`, the extractor demands the finder-methods
call set from the proxy's one-line bodies. No trails call can ever satisfy it —
the proxy is _supposed_ to call only `exec_explain` and the delegate. PR #6603
had to baseline four rows in
`scripts/api-compare/call-mismatches-exclude/activerecord/relation.json`:

- `first | find_nth`
- `first | find_nth_with_limit`
- `last | find_last`
- `last | limit`

`#average` / `#count` / `#maximum` / `#minimum` / `#pluck` / `#sum` did not flag
only because trails mixes those onto `Relation` from `relation/calculations.ts`
rather than declaring them in `relation.ts` — i.e. the four rows are an accident
of which homonyms happen to share a file, not a bounded set. Any future nested
`:nodoc:` class ported into its Rails file hits the same wall.

Sibling, not duplicate:
[[call-extractor-pairs-instance-method-with-classmethods-homonym]] is the same
collapse for a **class-vs-instance** homonym pair inside one file; this one is
**outer-class vs nested-class**, so the discriminator is the declaring
constant path rather than the receiver kind. Both likely want the same fix.

## Converged shape

Key extractor rows by the declaring constant path, not the file: the Ruby side
already knows a method belongs to `ActiveRecord::Relation::ExplainProxy` rather
than `ActiveRecord::Relation`, and the TS side knows the member was declared on
`class ExplainProxy`. Matching those two makes the proxy's `first` pair with
relation.rb:24-26 (call set `{exec_explain, first}`) instead of
finder_methods.rb:100.

## Acceptance criteria

- [ ] A nested class's members pair against the nested Ruby class's methods, not
      the outer class's homonyms.
- [ ] The four `first` / `last` rows in
      `call-mismatches-exclude/activerecord/relation.json` are deleted by hand
      and the shard's mark tightened with `pnpm parity:api:calls:tighten`.
- [ ] A regression fixture covers an outer/nested homonym pair and fails on the
      pre-fix extractor.
- [ ] `pnpm parity:api:calls` / `:args` green; `pnpm parity:api` delta
      non-negative.
