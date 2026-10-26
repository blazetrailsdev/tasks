---
title: "ruby-compat: Enumerator#toA and asyncIterator over a promise-answering each"
status: draft
updated: 2026-10-26
rfc: "0194-ruby-compat-native-first"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#9333 made the blockless `minBy` / `maxBy` / `eachCons` / `eachSlice` (`packages/ruby-compat/src/enumerable.ts`) answer an `Enumerator`. `Enumerator#toA` and `[Symbol.iterator]` (`packages/ruby-compat/src/enumerator.ts`) run `each` synchronously into a buffer. So over a receiver whose `each` answers a promise (the `LazyBag` case in `enumerable.trails.test.ts`), `eachSlice(bag, 2).toA()` reads an empty buffer. Before #9333, the blockless call answered a promise of the slices.

In Ruby, `enum.each_slice(2).to_a` (`vendor/ruby/v3.3.11/enum.c:3166`, `:711` `enum_to_a`) collects whatever `each` yields.

## Acceptance criteria

- [ ] `Enumerator#toA` over a receiver whose `each` answers a promise answers a promise of the elements, using the `Enumerated` shape `enumToA` uses in `enumerable.ts`.
- [ ] `Enumerator[Symbol.asyncIterator]` yields those elements under `for await`.
- [ ] Tests in `enumerator.trails.test.ts` cover `eachSlice(asyncReceiver, 2).toA()`.
