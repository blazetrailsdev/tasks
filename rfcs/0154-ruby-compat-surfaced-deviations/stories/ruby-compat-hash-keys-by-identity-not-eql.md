---
title: "ruby-compat Hash compares keys by identity where Ruby's Hash uses hash/eql?"
status: draft
updated: 2026-09-23
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

A Ruby `Hash` looks a key up by `hash`, then `eql?` (`vendor/ruby/hash.c`,
`rb_any_hash` / `any_cmp`). Identity comparison is the opt-in `compare_by_identity`.
ruby-compat's `Hash<K, V>` (`packages/ruby-compat/src/hash.ts:400`) extends `Map`, so
it always compares keys by JS identity: it is `compare_by_identity` by default.

Where Rails keys a Hash on a record, the port cannot key on the record. trails#8002
converged `HasManyThroughAssociation#distribution`
(`vendor/rails/activerecord/lib/active_record/associations/has_many_through_association.rb:193-197`,
`Hash.new(0)` keyed on the record) by keying on `record.hash()` instead
(`has-many-through-association.ts`). That works only because `Core#hash` returns an
exact, `==`-consistent key (hardened in #8002 for Symbol, NaN, nested and sparse ids),
and it spells every `distribution[record]` as `distribution.get(record.hash())`, which is
not the Rails call shape.

## Acceptance criteria

- ruby-compat's `Hash` looks keys up by `rbHash` then `rbEql`
  (`packages/ruby-compat/src/rb-hash.ts`, `rb-equal.ts`), as Ruby's does, with a
  `compareByIdentity()` port (`hash.c` `rb_hash_compare_by_id`) restoring today's
  identity behaviour. Every existing caller that relies on identity keying is audited and
  moved to `compareByIdentity()` or confirmed eql?-safe.
- `HasManyThroughAssociation#distribution` / `#markOccurrence` key on the record itself
  (`distribution.get(record)`), matching `has_many_through_association.rb:189-197`.
- ruby-compat unit tests cover eql?-keyed lookup, `compare_by_identity`, and default
  values under both modes.
