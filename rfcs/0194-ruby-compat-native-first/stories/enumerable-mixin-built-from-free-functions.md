---
title: "ruby-compat: the Enumerable / AsyncEnumerable mixins delegate to the free functions; ActiveSupport's extensions take any Iterable"
status: ready
updated: 2026-10-22
rfc: "0194-ruby-compat-native-first"
cluster: enumerable
packages: ["ruby-compat", "activesupport"]
deps: ["enumerable-free-functions-over-iterable"]
deps-rfc: []
est-loc: 400
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Enumerable` (`packages/ruby-compat/src/enumerable.ts:602`) and
`AsyncEnumerable` (`:637`) are plain-object modules, mixed in with
`include(Klass, Enumerable)` (CLAUDE.md "A Ruby module is a plain object or a
class module"). Their members are separate this-typed bodies, so once
`enumerable-free-functions-over-iterable` lands each method is written twice.
The ActiveSupport extensions to Enumerable (`index_by`, `many?`, `pluck`,
`excluding`, `maximum`, `in_order_of`) live as free functions in
`packages/activesupport/src/enumerable-utils.ts` and are not on the mixin at
all, although Rails reopens `Enumerable` with them
(`vendor/rails/v8.0.2/activesupport/lib/active_support/core_ext/enumerable.rb`).

## Acceptance criteria

- [ ] Each mixin member is `function (this: Each<T>, ...args) { return fn(this, ...args); }` over its free function, with no second body. `AsyncEnumerable` is built the same way over the promise-aware arm.
- [ ] Every member the mixin holds today is still there, with its includers' behavior unchanged (`hash-with-indifferent-access.ts` and the other `include(..., Enumerable)` sites).
- [ ] The ActiveSupport free functions accept `Iterable | Each` (not just `T[]`), and are rebuilt over the ruby-compat ones where Rails' body calls a core method (`maximum` is `max_by(&key)&.public_send(key)`, `enumerable.rb:47`).
- [ ] `pnpm parity:api:calls`, `:calls:args` and `parity:api:extra:gate` are green.
