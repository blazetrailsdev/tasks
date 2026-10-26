---
title: "ruby-compat: new Enumerable(x) answers Symbol.asyncIterator over a promise-answering each"
status: ready
updated: 2026-10-26
rfc: "0194-ruby-compat-native-first"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The `new Enumerable(x)` wrapper (trails#9292, `packages/ruby-compat/src/enumerable.ts`) answers only `Symbol.iterator`. When the wrapped `each` returns a promise, `for…of` throws "each is asynchronous". The story `enumerable-wrapper-over-any-iterable` allowed `Symbol.asyncIterator` over a promise-answering `each`, and `AsyncEnumerable[Symbol.asyncIterator]` is the existing shape for that.

## Acceptance criteria

- [ ] A wrapper over a promise-answering `each` supports `for await` and yields each element in order.
- [ ] `include(Klass, Enumerable)` includers get no new member from this change.
- [ ] Tests are in `enumerable.trails.test.ts`.
