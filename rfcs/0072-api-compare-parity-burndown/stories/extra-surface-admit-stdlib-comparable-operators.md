---
title: "extra-surface: include Comparable operators have no def and score as novel"
status: draft
updated: 2026-07-26
rfc: "0072-api-compare-parity-burndown"
cluster: null
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

Found while landing `extra-surface-adapter-cross-file-recurring-names` (PR 5345).

Ruby classes gain comparison operators from `include Comparable` after defining
only `<=>`. There is no `def >=` for `scripts/api-compare/extract-ruby-api.rb`
to record, so every faithful TS port of those operators scores as novel drift.

Concrete case: `AbstractAdapter::Version`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract_adapter.rb:243-259`)
does `include Comparable` and defines `<=>`, `to_s`, `full_version_string`.
trails spells the two operators any caller actually uses as `gte` and `lt`
(`connection-adapters/abstract-adapter.ts`), which currently needs an allowlist
entry even though the surface is Rails-faithful.

`collectAllowedNames` already walks `includes` via `walkMixin`, but `Comparable`
is a Ruby stdlib module with no entry in `rails-api.json`, so the walk finds
nothing and silently skips it (`if (!mod) continue`). The fix is a small
synthesized-mixin table: when a class includes a known stdlib module, add that
module's method set to the allow-set.

Scope it to what Rails actually includes — at minimum `Comparable`
(`<`, `<=`, `==`, `>`, `>=`, `between?`, `clamp`) and consider `Enumerable`
(note `extractor-capture-enumerable-metaprogrammed-surface`, RFC 0025, is done
and may already cover the Enumerable axis — check before widening).

Include the trails `Q`-suffix and is-prefix spellings via the existing
`rubyMethodCandidates`, plus the operator spellings trails uses (`gte`, `lt`,
`gt`, `lteq`) — these are not derivable from the Ruby name by
`rubyMethodToTs`, so they need an explicit mapping.

## Acceptance criteria

- A class that `include Comparable` and defines `<=>` admits the Comparable
  operator set into its file's allow-set, under the TS spellings trails uses.
- The mapping is a declared table with a comment naming the stdlib module, not
  a blanket allow.
- Tests in `scripts/api-compare/extra-surface.test.ts`.
- Delete the now-stale `gte` allowlist entry on
  `connection-adapters/abstract-adapter.ts` and record the novel-count delta.
