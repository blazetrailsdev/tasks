---
title: "activerecord: Base.allocate sets and deletes four class-level flags per loaded row; Class#allocate mutates nothing"
status: draft
updated: 2026-10-03
rfc: "0174-activerecord-api-parity-100"
cluster: null
packages: ["activerecord"]
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

MRI's `Class#allocate` (`rb_obj_alloc`, `vendor/ruby/v3.3.11/object.c:2117`)
returns an uninitialized instance and touches nothing else; Rails loads every
record through it (`vendor/rails/v8.0.2/activerecord/lib/active_record/persistence.rb:313`,
`klass.allocate.init_with_attributes(attributes, &block)`).

trails' `Base.allocate` (`packages/activerecord/src/base.ts`, `@noRailsEquivalent
CONVERGEABLE base-allocate-comes-from-a-ruby-compat-rb-obj-alloc`) is `new this()`
under FOUR class-level flags it sets on the class and restores afterwards —
`_suppressInitializeCallback`, `_suppressAbstractCheck`, `_suppressStiNewDispatch`
and `_allocating` (the last two since trails#8428). When the class had no own
value it restores with `delete`, so every loaded row adds and deletes up to four
properties on the class object, which V8 handles on a slow path and which also
slows later static lookups on that class.

Measured from trailmap over its 11,531 stories (blazetrailsdev/trailmap#30):
`Story.all()` ~2.1 s and `Story.claimable()` ~4.5 s at trails `37b3a13e5d`,
against ~1.0 s / ~2.6 s at `7cece02d` (which deleted two flags per row). A profile
puts ~29% of the load in `allocate`'s own body. Restoring the flags by assignment
instead gives 0.71 s / 1.8 s with identical records.

## Converged shape

`allocate` mutates no class state, as `Class#allocate` does not: the class being
allocated is held in one module-level slot (`core.ts`), saved and restored around
`new this()`. The constructor skips `_requireConcreteClass`, `new`'s STI dispatch
(`inheritance.rb:56-78`) and the initialize callbacks for that class, and
`Core#initInternals` builds no default attribute set for it — the things
`Class#allocate` never does. `static _allocating` is deleted. `becomes` keeps its
own flags (`becomes-constructs-via-new-instead-of-allocate`), and
`base-allocate-comes-from-a-ruby-compat-rb-obj-alloc` still deletes `allocate`.

## Acceptance criteria

- [ ] `allocate` sets and deletes no property on the class; `static _allocating` is gone.
- [ ] A loaded record still builds no default attribute set, takes no STI dispatch and runs no initialize callback from the allocation (the trails#8428 tests keep passing).
- [ ] A test: `allocate` leaves the class's own properties unchanged, and the allocation slot is restored, whether the constructor returns or throws.
- [ ] Loading 11,531 rows of trailmap's `Story` is at or below `7cece02d`'s ~1.0 s.
