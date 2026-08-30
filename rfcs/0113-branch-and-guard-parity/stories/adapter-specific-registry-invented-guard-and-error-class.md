---
title: "AdapterSpecificRegistry carries an invented register guard, lacks lookup varargs, and raises Error not ArgumentError"
status: draft
updated: 2026-08-30
rfc: "0113-branch-and-guard-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced while converging ActiveModel's `Type::Registry` in PR #7271 (RFC 0113).
ActiveModel's registry now matches `activemodel/lib/active_model/type/registry.rb:15-30`;
ActiveRecord's sibling, `packages/activerecord/src/type/adapter-specific-registry.ts:155-175`,
still diverges from `activerecord/lib/active_record/type/adapter_specific_registry.rb:19-33`
in three ways.

Rails:

```ruby
def register(type_name, klass = nil, **options, &block)
  unless block_given?
    block = proc { |_, *args| klass.new(*args) }
    block.ruby2_keywords if block.respond_to?(:ruby2_keywords)
  end
  registrations << Registration.new(type_name, block, **options)
end

def lookup(symbol, *args, **kwargs)
  registration = find_registration(symbol, *args, **kwargs)

  if registration
    registration.call(self, symbol, *args, **kwargs)
  else
    raise ArgumentError, "Unknown type #{symbol.inspect}"
  end
end
```

1. **Invented guard.** trails' `register` opens with
   `if (!block && klass == null) throw new TypeError("register requires either
   a klass or a block")`. Rails has no such check — a nil `klass` with no block
   builds a proc that raises `NoMethodError` on `nil.new` when the type is
   later looked up. The guard is invented surface with an invented message, and
   it moves the failure from lookup time to register time.
2. **No varargs on `lookup`.** trails takes a single `options?` parameter where
   Rails forwards `*args, **kwargs` — the same gap ActiveModel's registry had
   before #7271, and `find_registration` / `Registration#call` / `#matches?`
   (`:39-42`, `:54-56`, `:58-60`) all forward the same list.
3. **Wrong error class.** trails raises a plain `Error`
   (`adapter-specific-registry.ts:172`); Rails raises `ArgumentError`
   (`:31`). The message text already matches.

Note `registrations` is a private `attr_reader` in Rails and Rails' own writers
go through it (`registrations << ...`); trails pushes to the `_registrations`
field directly, bypassing the getter it also defines.

## Converged shape

Drop the invented `TypeError` guard; `lookup(symbol, ...args)` forwarding
positionals through `findRegistration` and `Registration#call`; raise
`ArgumentError` rather than `Error`. Mirror ActiveModel's converged
`register`/`lookup` pair (see `packages/activemodel/src/type/registry.ts`
after #7271).

## Acceptance criteria

- [ ] `register` carries no guard Rails does not have.
- [ ] `lookup` forwards varargs the way Rails forwards `*args, **kwargs`.
- [ ] The unknown-type raise is an `ArgumentError`.
- [ ] `pnpm parity:api:calls` / `:args` stay green; no new baseline rows.
