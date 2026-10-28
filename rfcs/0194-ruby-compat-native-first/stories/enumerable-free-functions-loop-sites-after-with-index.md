---
title: "enumerable-free-functions-loop-sites-after-with-index"
status: draft
updated: 2026-10-28
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

The `enumerable-free-functions-remaining-loop-and-enumerator-sites` PR added
`Enumerator#withIndex` (`enumerator_with_index`, `vendor/ruby/v3.3.11/enumerator.c:676`)
and block-less `eachWithIndex` / `eachWithObject` in
`packages/ruby-compat/src/enumerable.ts`, and converted
`calculations.rb:575`, `preloader/through_association.rb:99` and `fixtures.rb:788`
(paths under `vendor/rails/v8.0.2/activerecord/lib/active_record/`). Still open:

- `core.rb:289` (`find_by`, non-local `return super`), `persistence.rb:616`
  (plain-object receiver), `postgresql/schema_statements.rb:25` (String memo),
  `relation/batches.rb:415` (non-local `return`), `join_dependency/join_association.rb:29` (`break`).
- Block-less `each_with_index` chains: `enum.rb:261`, `statement_cache.rb:46`,
  `associations/join_dependency.rb:169,177`.
- The `each_with_object` / `each_with_index` / `sort_by!` sites outside activerecord.
- `activesupport/lib/active_support/ordered_hash.rb:30`: ruby-compat `Hash#each`
  yields `(k, v)` as two arguments, so `new Enumerable(orderedHash)` cannot wrap it.
- `Array#include?` stays receiver-keyed (`active_model/validations/acceptance.rb:20,79`, overridden `==`).
- `Array#count` (`connection_pool.rb:490,687-689`; `destroy_all` is a Rails method)
  and `Array#compact` / `#sort` (17 args rows needing receiver-as-first-arg alignment).

## Acceptance criteria

- [ ] Each site above uses the ruby-compat free function (now including the
      block-less enumerator + `withIndex`) or carries a cited language-forced reason.
- [ ] `Array#count` / `Array#compact` leave `RECEIVER_KEYED_RUBY_COMPAT_EXPORTS`, or the story records why they cannot.
- [ ] `parity:api:calls` and `:calls:args` stay green with no new baseline rows.
