---
title: "enumerable-free-functions-remaining-loop-and-enumerator-sites"
status: ready
updated: 2026-10-27
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

The bundle of `enumerable-free-functions-async-and-each-with-index-sites`,
`enumerable-wrapper-adoption-activesupport` and
`retire-array-helper-rows-after-native-sweep` added an awaiting arm to
ruby-compat's `eachWithObject` / `eachWithIndex` (`packages/ruby-compat/src/enumerable.ts`,
`rbBlockCall`'s `awaiting` parameter) and `isAll` (`enum_all`,
`vendor/ruby/v3.3.11/enum.c:1799`), and converted
`mysql/database_statements.rb:67`, `preloader/through_association.rb:12`,
`persistence.rb:139,165`, `schema_dumper.rb:139`,
`postgresql/database_statements.rb:179`, `share_lock.rb:210,214`,
`cache/coder.rb:96` and `strong_parameters.rb:998`. What remains
(paths under `vendor/rails/v8.0.2/`):

- `activerecord/lib/active_record/core.rb:289` (`find_by`, non-local `return super`),
  `fixtures.rb:788` (block awaits; can now use the awaiting `eachWithObject`),
  `persistence.rb:616` (plain-object receiver), `postgresql/schema_statements.rb:25`
  (String memo), `relation/batches.rb:415` (non-local `return`),
  `join_dependency/join_association.rb:29` (`break`).
- Enumerator chains: `calculations.rb:575` and `preloader/through_association.rb:99`
  (`each_with_object({}).with_index`), `enum.rb:261`, `statement_cache.rb:46`,
  `join_dependency.rb:169,177` (block-less `each_with_index`). These need a
  block-less form returning an enumerator with `with_index`.
- The 52 `each_with_object` sites and the `each_with_index` / `sort_by!` sites
  outside activerecord.
- `activesupport/lib/active_support/ordered_hash.rb:30` (`map { |k, v| }` on self):
  `new Enumerable(orderedHash)` cannot wrap it, because ruby-compat `Hash#each`
  yields `(k, v)` as two arguments and the wrapper's block takes one.
- `Array#include?` stays in `RECEIVER_KEYED_RUBY_COMPAT_EXPORTS`:
  `active_model/validations/acceptance.rb:20` compares with `==`, and
  `LazilyDefineAttributes#==` is overridden (`acceptance.rb:79`), so native
  `.includes` is wrong there even with the receiver proven.
- `Array#count` stays: `@connections` (`connection_pool.rb:687-689`) is also
  assigned `nil` (`:490`), so `typed_ivars` leaves it `ivar`; `destroy_all`
  (`has_many_through_association.rb:150`, `batch_enumerator.rb:99`) is a Rails
  method, which `chain_receiver_kind` deliberately never proves.
- `Array#compact` / `#sort`: the 17 args rows depending on receiver-as-first-arg alignment.

## Acceptance criteria

- [ ] Each remaining activerecord site uses the ruby-compat free function or
      carries a cited language-forced reason for staying a loop.
- [ ] A block-less `eachWithIndex` / `eachWithObject` enumerator with `withIndex`
      lands, and the `.with_index` chains use it.
- [ ] `Array#count` and `Array#compact` leave `RECEIVER_KEYED_RUBY_COMPAT_EXPORTS`
      once the extractor can prove their receivers, or the story records why they cannot.
- [ ] `parity:api:calls` and `:calls:args` stay green with no new baseline rows.
