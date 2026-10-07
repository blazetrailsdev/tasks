---
title: "activerecord: Persistence#becomes is allocate + initialize; the two suppress statics leave Base"
status: closed
updated: 2026-10-07
rfc: "0181-activerecord-member-placement"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Duplicate of persistence-becomes-allocates-then-initializes-without-suppress-flags (RFC 0178, ready), filed without checking the backlog first."
---

## Context

Rails' `Persistence#becomes`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/persistence.rb:487-500`) is

```ruby
became = klass.allocate
became.send(:initialize) do |becoming|
  @attributes.reverse_merge!(becoming.instance_variable_get(:@attributes))
  becoming.instance_variable_set(:@attributes, @attributes)
  ...
end
became
```

so it never enters `Inheritance::ClassMethods#new` (`inheritance.rb:56-78`): no abstract raise, no
STI dispatch.

trails' `becomes` (`packages/activerecord/src/persistence.ts`) calls `new klass({}, block)`, which
per CLAUDE.md § "A record is built with `new Klass` only" IS `Inheritance::ClassMethods#new`. To
skip it, `becomes` writes two statics on `klass` around the call, `_suppressStiNewDispatch` and
`_suppressAbstractCheck`, with a hadOwn / prev / delete restore in a `try` / `finally` Rails does
not have. `Base`'s constructor (`packages/activerecord/src/base.ts`) reads both.

Problems the review of trails#8659 named:

- `_suppressAbstractCheck` is a static, so every subclass of `klass` inherits it for the duration
  of the block: a nested `new Sub()` inside the `becoming` block or an `after_initialize` callback
  skips the abstract raise. `_suppressStiNewDispatch` protects only the exact class.
- Both flags are surface with no Rails counterpart.

`klass.allocate()` already exists and makes the constructor skip both arms through
`_Core._allocation`. What is missing is an `initialize` to send to the allocated record:
`Core#initialize` (`core.rb:471-482`) is ported as `constructor` in `core.ts`, but
`initialize_internals_callback` (`inheritance.rb`, `scoping.rb:54-57`), the block yield and
`_run_initialize_callbacks` run in the tail of `Base`'s constructor instead, so
`became.initialize(null, block)` today would skip `ensure_proper_type` and the `after_initialize`
callbacks. `base-allocate-comes-from-a-ruby-compat-rb-obj-alloc` owns the allocation slot itself.

## Acceptance criteria

- [ ] `core.ts`'s `constructor` is `core.rb:471-482` line for line: `initialize_internals_callback`
      after `init_internals`, `super`, the block yield, `_run_initialize_callbacks`. `Base`'s
      constructor tail no longer carries those steps.
- [ ] `becomes` is `persistence.rb:487-500`: `klass.allocate()`, then `initialize` with the block.
      No `try` / `finally`.
- [ ] `_suppressStiNewDispatch` and `_suppressAbstractCheck` are deleted from `base.ts` and
      `persistence.ts`.
- [ ] A test covers a nested `new` of an abstract subclass inside a `becomes` block raising
      `NotImplementedError`, and `after_initialize` firing once on the record `becomes` returns.
- [ ] `persistence.test.ts`, `inheritance.test.ts`, `core.trails.test.ts` green; `parity:api:calls`
      green with no new baseline row.
