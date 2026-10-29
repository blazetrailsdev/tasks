---
title: "enumerable-free-functions-remaining-loop-sites-after-packing"
status: draft
updated: 2026-10-29
rfc: "0194-ruby-compat-native-first"
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

`rbBlockCall` (`packages/ruby-compat/src/enumerable.ts`) now packs a multi-value
`each` yield as `rb_enum_values_pack` does (`vendor/ruby/v3.3.11/enum.c:53`), and
`statement_cache.rb:46` / `join_dependency.rb:169,177` now read as
`each_with_index.find_all` / `.map`. Still open, from
`enumerable-free-functions-loop-sites-after-with-index` (paths under
`vendor/rails/v8.0.2/activerecord/lib/active_record/`):

- `core.rb:289` (`find_by`, non-local `return super`), `persistence.rb:616`
  (plain-object receiver), `postgresql/schema_statements.rb:25` (String memo),
  `relation/batches.rb:415` (non-local `return`), `join_dependency/join_association.rb:29` (`break`).
- `enum.rb:261` block-less `each_with_index` (`packages/activerecord/src/enum.ts:266` still casts it to an Iterable).
- The `each_with_object` / `each_with_index` / `sort_by!` sites outside activerecord.
- `activesupport/lib/active_support/ordered_hash.rb:30`: now unblocked by packing.
- `Array#count` (`connection_pool.rb:490,687-689`) and `Array#compact` / `#sort` leaving `RECEIVER_KEYED_RUBY_COMPAT_EXPORTS` (`scripts/parity/ruby-compat.ts`).

## Acceptance criteria

- [ ] Each site above uses the ruby-compat free function or carries a cited language-forced reason.
- [ ] `Array#count` / `Array#compact` leave `RECEIVER_KEYED_RUBY_COMPAT_EXPORTS`, or the story records why they cannot.
- [ ] `parity:api:calls` and `:calls:args` stay green with no new baseline rows.
