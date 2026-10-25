---
title: "ruby-compat: Enumerable is a class module that also wraps any Iterable — new Enumerable(xs).partition(fn) — credited as xs.partition"
status: done
updated: 2026-10-25
rfc: "0194-ruby-compat-native-first"
cluster: enumerable
packages: ["ruby-compat"]
deps: ["enumerable-mixin-built-from-free-functions", "call-args-enumerable-free-function-receiver"]
deps-rfc: []
est-loc: 450
priority: null
pr: trails#9292
claim: "2026-10-24T23:20:37Z"
assignee: "enumerable-wrapper-over-any-iterable"
blocked-by: null
closed-reason: null
---

## Context

The owner wants the wrapper spelling as well as the free functions
(2026-10-19): `new Enumerable(xs).partition(fn)`, `new Enumerable(set).eachSlice(2, fn)`
over an Array, Set, Map, generator or `each`-answerer. Today `Enumerable`
(`packages/ruby-compat/src/enumerable.ts:602`) is a plain-object module that
can only be mixed in with `include(Klass, Enumerable)`, and nothing wraps an
arbitrary iterable. CLAUDE.md "A Ruby module is a plain object or a class
module" allows a class module (`static readonly [classModule] = true`), whose
prototype holds the instance methods `include()` copies. One class can
therefore be both the mixin and the wrapper.

## Acceptance criteria

- [ ] `Enumerable` is a class module. Its constructor takes `Iterable<T> | Each<T>` and gives the instance an `each` over it (Map yields `[k, v]` pairs). Its prototype members are the one-line delegations to the free functions from `enumerable-mixin-built-from-free-functions`, so the wrapper, the mixin and the free functions share one body each.
- [ ] `include(Klass, Enumerable)` still works for every current includer, unchanged.
- [ ] The wrapper also answers `Symbol.iterator` (or `Symbol.asyncIterator` over a promise-answering `each`), so `for…of` and spread work on it. Members that answer a collection return plain Arrays or `Hash`, as Ruby does, never a new wrapper.
- [ ] The call gates credit `new Enumerable(x).m(...)` as Ruby `x.m(...)`: `parity:api:calls` credits the member name, and `parity:api:calls:args` reads the constructor argument as the receiver. Tests are in `compare.test.ts` / `call-args.test.ts`.
- [ ] Tests in `enumerable.trails.test.ts` cover the wrapper over an Array, a Set, a Map, a generator and an `each`-answerer.
