---
title: "rbBlockCall packs multi-value yields (rb_enum_values_pack); each receivers yield only Ruby's values"
status: draft
updated: 2026-10-28
rfc: "0194-ruby-compat-native-first"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Ruby's Enumerable methods pack a multi-value `each` yield into one Array
(`rb_enum_values_pack`, `vendor/ruby/v3.3.11/enum.c:53`, via `ENUM_WANT_SVALUE`
at `:60`), so `each_with_index.map { |(x, i)| }` and `hash.map { |k, v| }` see a
pair. ruby-compat's `rbBlockCall` (`packages/ruby-compat/src/enumerable.ts`)
passes only the first argument to the block.

On trails#9413 I tried packing in `rbBlockCall`. It broke activemodel `Errors`
("each when arity is negative", `errors.first(...).inspect`), the relation
serialization paths and several AR SQLite tests. The cause: trails `each`
receivers pass extra JS arguments that Ruby never yields (a forEach-style index,
the array). So callers read an `each_with_index` enumerator through
`Enumerator#toA` (which packs) instead of `map` / `findAll`, as
`statement-cache.ts` and `join-dependency.ts` now do. The same gap blocks
wrapping `ordered_hash.rb:30`.

## Acceptance criteria

- [ ] Every ruby-compat `each` receiver yields exactly the values its Ruby
      counterpart yields (no extra index or array argument).
- [ ] `rbBlockCall` packs a multi-value yield as `rb_enum_values_pack` does.
- [ ] The `.toA()` reads in `statement-cache.ts` and `associations/join-dependency.ts`
      become Rails' `each_with_index.find_all` / `.map` (`statement_cache.rb:46`,
      `join_dependency.rb:169,177`).
