---
title: "type-registry-variadic-lookup-forwarding"
status: ready
updated: 2026-08-17
rfc: "0132-ar-closure-assertion-parity"
cluster: assertion-parity
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

`ActiveModel::Type::Registry#lookup` is `def lookup(symbol, ...)` forwarding
**every** argument to the registered block, which `register` builds as
`proc { |_, *args| klass.new(*args) }` (registry.rb:15-31); `ActiveModel::Type.lookup`
forwards the same way (type.rb:34-36). trails models that variadic tail as a single
options object instead:

    // packages/activemodel/src/type/registry.ts
    export type TypeFactory = (name: string, options?: TypeOptions) => Type;
    lookup(name: string, options?: TypeOptions): Type

TypeScript expresses rest args natively (`lookup(name, ...args)`), so this is a
trails design choice, not a language shortcoming — it is debt, not a ratified
deviation.

Surfaced while porting `type_test.rb` in PR #6642
(`assertions-activemodel-remainder-third-pass`). Rails' test is:

    type = Struct.new(:args)
    ActiveModel::Type.register(:foo, type)
    assert_equal type.new(:arg), ActiveModel::Type.lookup(:foo, :arg)
    assert_equal type.new({}), ActiveModel::Type.lookup(:foo, {})

Two bare positional arguments. The port could only spell them as option objects
(`{ precision: 1 }` / `{}`), which still pins that `lookup` forwards its argument
at all — the behaviour the Rails test exists for — but not Rails' actual values.
That substitution is called out at the call site in
`packages/activemodel/src/type.test.ts`.

The sibling half of this — `lookup`'s not-found message, which Rails builds as
`"Unknown type #{symbol.inspect}"` (registry.rb:26) — was converged by #6643 and is
already `Unknown type :${name}` in `registry.ts`. Nothing left to do there; only the
variadic forwarding below remains.

## Acceptance criteria

- `TypeRegistry#register`/`#lookup` and `Type.register`/`Type.lookup` forward a
  variadic argument list, matching `registry.rb:19-27` and `type.rb:31-36`.
- The 12 built-in registrations in `registry.ts`'s constructor, and AR's own
  registrations, are updated to the forwarded shape.
- `type_test.rb`'s "registering a new type" asserts Rails' own positional
  arguments; the option-object substitution note in `type.test.ts` is deleted.
- `pnpm parity:api` / `pnpm parity:test` deltas non-negative; `pnpm parity:api:calls`
  and `pnpm parity:api:calls:args` clean.
