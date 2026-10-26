---
title: "Retire Array#compact/count/include? ruby-compat rows once their sites write the native form"
status: ready
updated: 2026-10-26
rfc: "0194-ruby-compat-native-first"
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

trails#9260 credited native Array forms on a Ripper-proven `array` receiver (`NATIVE_FORM_ANALOGUES`, `scripts/api-compare/enumerable-idioms.ts`). It could not take `Array#compact`, `#count`, `#include?`, `#join` and `#sort` out of `RECEIVER_KEYED_RUBY_COMPAT_EXPORTS` (`scripts/parity/ruby-compat.ts`). Removing them reds two gates:

- **call-set, 4 rows.** On these sites the helper is the only proof the receiver is an Array, because the receiver is `expr` / `ivar`:
  - `aryIncludes`: `packages/activemodel/src/validations/acceptance.ts:30`
  - `aryCount`:
    - `packages/activerecord/src/associations/has-many-through-association.ts:229`
    - `packages/activerecord/src/connection-adapters/abstract/connection-pool.ts:607-609`
    - `packages/activerecord/src/relation/batches/batch-enumerator.ts:97`
- **args, 17 rows.** The `compact(xs)` / `sort(xs)` call sites depend on those rows for receiver-as-first-arg alignment (`call-args.ts#receiverIsFirstArg`), in globalid, marcel, rack, thor, trailties, activesupport and activerecord.

Semantics that bound the convergence:

- A comparator-less JS `.sort()` compares strings, where `rb_ary_sort` uses `<=>` (`vendor/ruby/v3.3.11/array.c`, `sort_2`). `sort` keeps its helper unless the elements are proven strings.
- Native `.join` does not flatten nested arrays or render `nil` as `""`, as `ary_join_1` does. `join` keeps `aryJoin` for those receivers.

## Acceptance criteria

- [ ] Each site above writes the native form (`.filter((x) => x != null)`, `.filter(fn).length`, `.includes`) wherever its receiver can be proven `array`. The Ruby extractor's proof reaches the receiver: method-return or ivar typing in `extract-ruby-api.rb#typed_ivars` / `chain_receiver_kind`.
- [ ] `Array#compact`, `#count` and `#include?` leave `RECEIVER_KEYED_RUBY_COMPAT_EXPORTS` once no site depends on them.
- [ ] `pnpm parity:api:calls` and `:calls:args` stay green with no new baseline rows.
