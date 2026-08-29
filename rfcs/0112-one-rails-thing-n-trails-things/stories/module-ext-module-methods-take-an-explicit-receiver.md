---
title: "module-ext's Module# methods take an explicit receiver where configurable.ts is this-typed"
status: draft
updated: 2026-08-29
rfc: "0112-one-rails-thing-n-trails-things"
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

`module-ext.ts` ports eight Ruby `Module#` / `Rescuable::ClassMethods` methods as
free functions taking the receiver as an explicit first argument:

- `delegate(target, methods, options)` — `core_ext/module/delegation.rb:160`
  (`def delegate(*methods, to: nil, prefix: nil, allow_nil: nil, private: nil)`)
- `mattrReader(target, syms, options)` — `core_ext/module/attribute_accessors.rb:55`
- `mattrWriter(target, syms, options)` — `attribute_accessors.rb:121`
- `mattrAccessor(target, syms, options)` — `attribute_accessors.rb:208`
  (plus the `cattrReader`/`cattrWriter`/`cattrAccessor` aliases, `:74,:140,:213`)
- `configAccessor(target, syms, options)`
- `attrInternalReader(target, ...attrs)` / `attrInternalWriter(target, ...attrs)` —
  `core_ext/module/attr_internal.rb:5,10`
- `rescueFrom(target, klasses, options)` — `rescuable.rb:53`

In Rails all eight are instance methods on `Module` (or on the `Rescuable`
concern's `ClassMethods`), so the receiver is implicit `self` and there is no
first parameter at all. CLAUDE.md's "Module mixins (Ruby `include` →
TypeScript)" section already settles the trails spelling for exactly this: a
`this`-typed function. **`configurable.ts:90` is that spelling in the same
package** — `export function configAccessor(this: any, ...namesAndOptions)` —
so activesupport currently ships both shapes for the same Ruby idiom, which is
this RFC's pathology.

The explicit receiver has a second, measurable cost. Because it occupies
position 0, the port cannot spell Rails' splat and its kwargs as two separate
parameters and still line up: PR #7209 had to convert `mattr_*` / `delegate` /
`rescue_from` from a single variadic bag (`...namesAndOptions`) to the
receiver / array / options shape `packages/activerecord/src/delegate.ts` uses,
so that `syms` / `methods` / `klasses` and `options` each had a slot. That trade
lost Rails' splat: Ruby writes `mattr_accessor :a, :b, default: 1`, trails now
writes `mattrAccessor(K, ["a", "b"], { default: 1 })`. Under `this`-typing the
splat comes back — `mattrAccessor.call(K, "a", "b", { default: 1 })` — because
`stripThis` removes the receiver from the compared signature (`arity.ts:146`).

## Converged shape

Each function becomes `this`-typed, keeping the Rails parameter names and Rails'
splat:

```ts
export function mattrReader(this: any, ...syms: [...string[], MattrOptions?]): void
export function delegate(this: object, ...methods: [...string[], DelegateOptions]): string[]
export function rescueFrom(this: any, ...klasses: [...ErrorClass[], { with?: ErrorHandler }]): void
export function attrInternalReader(this: object, ...attrs: string[]): void
```

Call sites move from `mattrAccessor(K, ["a"], opts)` to
`mattrAccessor.call(K, "a", opts)`. There are ~55, all but one in activesupport
tests (`module-ext.test.ts`, `core-ext/module.test.ts`,
`core-ext/module/attribute-accessor*.test.ts`, `hwia-module-string.test.ts`,
`rescuable.test.ts`); the exception is
`packages/actionpack/src/action-dispatch/middleware/actionable-exceptions.ts:35`.

`delegateMissingTo` is NOT in scope: Ruby's `delegate_missing_to(target,
allow_nil:)` (`delegation.rb:218`) has a real first parameter named `target`,
and PR #7209 already put the host object on the conventional `host` receiver
spelling beside it.

## Acceptance criteria

- Each of the eight functions is `this`-typed, carries Rails' parameter names
  from the cited `file:line`, and takes Rails' splat rather than an array.
- Every call site is updated; no test is renamed.
- `pnpm parity:api` methods and arity are non-negative, `pnpm parity:api:params`
  still reports `activesupport 0/0` (the package is gated at 0 as of #7209),
  and `parity:api:calls` / `parity:api:calls:args` add no row.
- activesupport and actionpack suites green.
