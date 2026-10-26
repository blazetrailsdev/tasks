---
title: "enumerable-table-dispatch-for-each-receivers"
status: in-progress
updated: 2026-10-26
rfc: "0194-ruby-compat-native-first"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#9339
claim: "2026-10-26T17:48:43Z"
assignee: "enumerable-table-dispatch-for-each-receivers"
blocked-by: null
closed-reason: null
---

## Context

`Enumerator#each` (`packages/ruby-compat/src/enumerator.ts`) dispatches with `rbFSend(obj, meth, ...)`. `rbFSend` reaches `ENUMERABLE_METHOD_TABLE` only for Array, Set, Map and plain-hash receivers (`enumerableMethod`, `packages/ruby-compat/src/object.ts`). A user `Each` / Iterable class that includes Enumerable in Ruby, such as the test's `GenericEnumerable`, therefore raises NoMethodError when `indexBy(generic).each(block)` is called.

Rails runs `payments.index_by.each(&:price)` and `payments.index_with.each(&:price)` over GenericEnumerable (`vendor/rails/v8.0.2/activesupport/test/core_ext/enumerable_test.rb:252,268`). trails#9321 runs those two assertions over an Array instead.

## Acceptance criteria

- [ ] `rbFSend` / `basicObjRespondTo` answer `ENUMERABLE_METHOD_TABLE` entries for a receiver that defines `each` or `Symbol.iterator` (Ruby's `include Enumerable`).
- [ ] The two assertions in `packages/activesupport/src/core-ext/enumerable.test.ts` ("index by", "index with") run over `GenericEnumerable`.
