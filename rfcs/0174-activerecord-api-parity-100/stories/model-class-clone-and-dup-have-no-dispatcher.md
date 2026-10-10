---
title: "Inheritance: a model class cannot be cloned, so initialize_clone is unreachable and ClassMethods#dup is unported"
status: ready
updated: 2026-10-10
rfc: "0174-activerecord-api-parity-100"
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

Rails copies a model CLASS through `Class#dup` / `Class#clone`, and
`ActiveRecord::Inheritance::ClassMethods` hooks both
(`vendor/rails/v8.0.2/activerecord/lib/active_record/inheritance.rb:226-237`):

```ruby
def dup # :nodoc:
  # `initialize_dup` / `initialize_copy` don't work when defined
  # in the `singleton_class`.
  other = super
  other.set_base_class
  other
end

def initialize_clone(other) # :nodoc:
  super
  set_base_class
end
```

trails#8385 ported `initialize_clone` as `initializeClone` in
`packages/activerecord/src/inheritance.ts`, prepended onto `Base` in `base.ts`. Nothing dispatches
it: `rbObjClone` / `rbObjDup` (`packages/ruby-compat/src/include.ts`) allocate the copy with
`Object.create(proto)`, so the copy of a class constructor is a non-callable object, not a class.
The hook is reached only from `inheritance.trails.test.ts`, which calls it directly.

The class-level `dup` at `inheritance.rb:226-232` has no trails body at all: `inheritance.ts`
defines no class-level `dup`, although `parity:api` reports `inheritance.rb` at 35/35.

## Converged shape

Decide how a class is copied, in ruby-compat, mirroring MRI's `rb_mod_init_copy` /
`rb_class_init_copy` (`vendor/ruby/v3.3.11/class.c:524`): the copy must be constructible and carry
the original's statics and prototype members. `Module#dup` in `include.ts` is the existing precedent
for a module. Then:

- `rbObjClone(SomeModel)` returns a usable class and dispatches `initializeClone`, so
  `set_base_class` runs on the copy.
- `Inheritance::ClassMethods#dup` is ported at its Rails name with Rails' body (`super`, then
  `other.set_base_class`).

If a JS class constructor genuinely cannot be copied, block this story with that specific finding
rather than leaving the unreachable hook unrecorded.

## Acceptance criteria

- [ ] `rbObjClone` / `rbObjDup` on a class constructor return a constructible class, or the story is blocked with the language-level reason.
- [ ] `Inheritance::ClassMethods#dup` (`inheritance.rb:226-232`) has a trails body in `inheritance.ts`, and it is clear which TS member `parity:api` credits for it.
- [ ] A test clones a model class and asserts the copy's base class is recomputed, without calling `initializeClone` directly.
