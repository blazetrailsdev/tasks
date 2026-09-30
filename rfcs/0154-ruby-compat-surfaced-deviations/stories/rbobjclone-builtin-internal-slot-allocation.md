---
title: "rbobjclone-builtin-internal-slot-allocation"
status: draft
updated: 2026-09-30
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
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

# ruby-compat: rbObjClone / rbObjDup cannot allocate a built-in with internal slots

## Context

`packages/ruby-compat/src/include.ts` `rbObjClone` / `rbObjDup` port MRI
`rb_obj_clone` / `rb_obj_dup` (`vendor/ruby/v3.3.11/object.c:536,591`), whose
allocation step is `rb_obj_alloc(rb_obj_class(obj))`. The allocator for a
class with native data (Date, Hash, String) builds that data, and the class's
`initialize_copy` then fills it in (e.g. `Date#initialize_copy`).

trails allocates with `Object.create(proto)`, plus a real array since
trails#8302. A JS built-in whose state lives in internal slots, such as a
`Temporal.*` value, `Map`, `Set`, `Date` or a typed array, comes back as a
prototype-only shell. Any method on it then throws
`TypeError: invalid receiver`. Reproduction:
`rbObjClone(new Arel.Nodes.Equality(attr, Temporal.PlainDate.from("2020-01-02"))).right.toString()`.
The Arel DSL wraps values in `Casted` (no `initialize_copy`), so only a
hand-built node reaches this. The old `objectClone` had the same hole.

## Acceptance criteria

- [ ] `rbObjClone` / `rbObjDup` allocate a copy that carries the internal
      state of `Map`, `Set`, `Date`, typed arrays and `Temporal` values. This
      mirrors each Ruby class's allocator + `initialize_copy`, with an MRI
      citation.
- [ ] `include.test.ts` covers each allocated kind for both functions.
