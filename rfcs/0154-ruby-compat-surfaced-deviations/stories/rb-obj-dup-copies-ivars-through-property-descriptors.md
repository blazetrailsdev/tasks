---
title: "ruby-compat: rbObjDup copies through property descriptors (~35x a plain clone); MRI rb_obj_dup copies the ivar table (object.c:295,591)"
status: draft
updated: 2026-10-03
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: ["ruby-compat"]
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

MRI's `rb_obj_dup` (`vendor/ruby/v3.3.11/object.c:591`) allocates and copies
the instance-variable table straight across (`rb_obj_copy_ivar`,
`object.c:295`, via `init_copy`, `object.c:359`), then calls `initialize_dup`.

trails' `rbObjDup` (`packages/ruby-compat/src/include.ts:1171`) copies every
own property through `Object.getOwnPropertyDescriptors`, rewrites each
descriptor's `writable` / `configurable`, and rebuilds the object with
`Object.defineProperties`. Measured on a six-field plain object: ~5.5µs per
dup, against ~0.16µs for an `Object.assign` clone, with ~2µs of it in the
descriptor read alone. Objects built by `defineProperties` are also slower to
read afterwards.

It matters because `Attribute#dup` is `rbObjDup` (trails#8399), and
`AttributeSet#deepDup` dups every attribute: a `new` record dups each column,
and before trails#8428 a loaded one dupped each column three times — 1.1s to
4.4s for 11,531 rows of a 17-column table.

## Converged shape

Copy the ivars as `rb_obj_copy_ivar` does: own plain data properties are copied
by value onto the new object, and the descriptor path is kept only for what an
ivar copy cannot express (accessors, non-enumerable or symbol-keyed
properties, the singleton / extended-module keys `rbObjDup` already strips).
Same observable result as today for every object, including frozen ones.

## Acceptance criteria

- [ ] `rbObjDup` produces the same own properties, prototype and `initializeDup` dispatch as today for plain, frozen, accessor-bearing and singleton-extended objects (existing `include` tests plus one per case).
- [ ] A plain six-field object dups in under 1µs.
- [ ] `rbObjClone` shares the fast path where its semantics allow.
